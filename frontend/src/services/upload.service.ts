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
    const settled = await Promise.allSettled(
      files.map((file) => UploadService.uploadImage(file, { context })),
    );

    const uploaded = settled.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    );
    const failure = settled.find((result) => result.status === "rejected");

    if (failure) {
      await Promise.all(
        uploaded.map((upload) => UploadService.remove(upload.uploadId)),
      );
      throw (failure as PromiseRejectedResult).reason;
    }

    return uploaded;
  },

  async sendWithPhotos(
    endpoint: string,
    method: "POST" | "PUT",
    { photoFiles, ...rest }: { photoFiles?: File[] } & Record<string, any>,
  ): Promise<ApiResponse<any>> {
    let uploads: UploadResult[] = [];

    if (photoFiles?.length) {
      try {
        uploads = await UploadService.uploadImages(photoFiles, "listing-photo");
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Photo upload failed",
        };
      }
    }

    const response = await apiRequest(endpoint, {
      method,
      body: JSON.stringify({
        ...rest,
        ...(uploads.length
          ? { photoUploadIds: uploads.map((upload) => upload.uploadId) }
          : {}),
      }),
    });

    if (!response.success) {
      await Promise.all(
        uploads.map((upload) => UploadService.remove(upload.uploadId)),
      );
    }

    return response;
  },
};
