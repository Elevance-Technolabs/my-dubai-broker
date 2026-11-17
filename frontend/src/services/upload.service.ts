import { apiRequest } from "@/core/api";
import type { ApiResponse } from "@/types/types";
import type {
  PresignedUpload,
  UploadContext,
  UploadResult,
} from "@/types/upload";
import {
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_IMAGE_TYPES,
  putFileToR2,
  validateImageFile,
} from "@/lib/utils/r2Upload";
import { optimizeImage, type ImagePreset } from "@/lib/utils/imageOptimize";
import type { ListingPhoto } from "@/lib/schemas/listingBase";

interface UploadImageOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
  isPublic?: boolean;
  context?: UploadContext;
  /** Accept PDFs and other documents (not just images) on a signed-in upload. */
  documents?: boolean;
  /**
   * How to shrink the image before upload (WebP, resized). Defaults from the
   * upload context; documents and uploads without a context are never changed,
   * so licence scans stay exactly as the partner sent them.
   */
  optimize?: ImagePreset | false;
}

const PRESET_BY_CONTEXT: Partial<Record<UploadContext, ImagePreset>> = {
  "listing-photo": "photo",
  "company-cover": "photo",
  "product-image": "photo",
  "company-logo": "logo",
  "company-listing-logo": "logo",
};

// Only a few images are decoded at once: ten full-size phone photos decoded
// together can run a phone out of memory. Two at a time where the browser
// reports enough memory (4 GB+), otherwise one. Uploads still run in parallel.
const optimizeSlots = (() => {
  if (typeof navigator === "undefined") return 1;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return memory !== undefined && memory >= 4 && (navigator.hardwareConcurrency ?? 1) >= 4 ? 2 : 1;
})();
let optimizeRunning = 0;
const optimizeWaiting: (() => void)[] = [];

const optimizeInTurn = async (file: File, preset: ImagePreset) => {
  if (optimizeRunning >= optimizeSlots) {
    await new Promise<void>((resolve) => optimizeWaiting.push(resolve));
  } else {
    optimizeRunning++;
  }
  try {
    return await optimizeImage(file, preset);
  } finally {
    // Hand the slot straight to the next image, or free it.
    const next = optimizeWaiting.shift();
    if (next) next();
    else optimizeRunning--;
  }
};

const presignRequest = (
  endpoint: string,
  file: File,
  uploadContext?: UploadContext,
) =>
  apiRequest<PresignedUpload>(endpoint, {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      ...(uploadContext ? { uploadContext } : {}),
    }),
  });

export const UploadService = {
  async presign(file: File, uploadContext?: UploadContext) {
    return presignRequest("/uploads/presign", file, uploadContext);
  },

  async presignPublic(file: File, uploadContext?: UploadContext) {
    return presignRequest("/uploads/public/presign", file, uploadContext);
  },

  async remove(uploadId: string) {
    return apiRequest<null>(`/uploads/${uploadId}`, { method: "DELETE" });
  },

  async uploadImage(
    file: File,
    { onProgress, signal, isPublic, context, documents, optimize }: UploadImageOptions = {},
  ): Promise<UploadResult> {
    const preset = optimize === undefined ? (context && PRESET_BY_CONTEXT[context]) : optimize;
    if (preset) file = await optimizeInTurn(file, preset);
    if (signal?.aborted) throw new Error(`Upload of "${file.name}" was cancelled.`);

    const validationError = validateImageFile(
      file,
      isPublic || documents ? ALLOWED_DOCUMENT_TYPES : ALLOWED_IMAGE_TYPES,
    );
    if (validationError) throw new Error(validationError);

    const presign = isPublic
      ? await UploadService.presignPublic(file, context)
      : await UploadService.presign(file, context);
    if (!presign.success || !presign.data) {
      throw new Error(
        `Could not upload "${file.name}": ${presign.error || "could not start upload"}`,
      );
    }

    const { uploadId, uploadUrl, key } = presign.data;

    try {
      await putFileToR2(uploadUrl, file, onProgress, signal);
    } catch (error) {
      if (!isPublic) await UploadService.remove(uploadId);
      throw error;
    }

    return { uploadId, key };
  },

  async uploadImages(
    files: File[],
    context?: UploadContext,
  ): Promise<UploadResult[]> {
    // At most 4 at a time: a listing can have 30 photos, and 30 uploads at
    // once on a phone connection would all crawl (and some time out).
    const results: PromiseSettledResult<UploadResult>[] = new Array(files.length);
    let next = 0;
    const worker = async () => {
      while (next < files.length) {
        const index = next++;
        try {
          results[index] = { status: "fulfilled", value: await UploadService.uploadImage(files[index]!, { context }) };
        } catch (reason) {
          results[index] = { status: "rejected", reason };
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, files.length) }, worker));

    const uploaded = results.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    );
    const failure = results.find((result) => result.status === "rejected");

    if (failure) {
      await Promise.all(
        uploaded.map((upload) => UploadService.remove(upload.uploadId)),
      );
      throw (failure as PromiseRejectedResult).reason;
    }

    return uploaded;
  },

  /**
   * Saves a listing with its photos in the order shown in the form (the first
   * is the cover). New photos are uploaded first; the API then gets which
   * existing photos to keep, the new uploads, and the full order.
   */
  async sendWithPhotos(
    endpoint: string,
    method: "POST" | "PUT",
    { photos, ...rest }: { photos?: ListingPhoto[] } & Record<string, any>,
  ): Promise<ApiResponse<any>> {
    const items = photos ?? [];
    const newItems = items.filter((photo) => photo.file);
    let uploads: UploadResult[] = [];

    if (newItems.length) {
      try {
        uploads = await UploadService.uploadImages(
          newItems.map((photo) => photo.file!),
          "listing-photo",
        );
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Photo upload failed",
        };
      }
    }

    const uploadIdFor = new Map(newItems.map((photo, i) => [photo.id, uploads[i]!.uploadId]));
    const photoFields = photos
      ? {
          photoUploadIds: uploads.map((upload) => upload.uploadId),
          ...(method === "PUT"
            ? { existingPhotoKeys: items.filter((p) => !p.file && p.url).map((p) => p.url!) }
            : {}),
          photoOrder: items.map((photo) =>
            photo.file ? `upload:${uploadIdFor.get(photo.id)}` : photo.url!,
          ),
        }
      : {};

    const response = await apiRequest(endpoint, {
      method,
      body: JSON.stringify({ ...rest, ...photoFields }),
    });

    if (!response.success) {
      await Promise.all(
        uploads.map((upload) => UploadService.remove(upload.uploadId)),
      );
    }

    return response;
  },
};
