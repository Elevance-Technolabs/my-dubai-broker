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

interface UploadImageOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
  isPublic?: boolean;
  context?: UploadContext;
}

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
    { onProgress, signal, isPublic, context }: UploadImageOptions = {},
  ): Promise<UploadResult> {
    const validationError = validateImageFile(
      file,
      isPublic ? ALLOWED_DOCUMENT_TYPES : ALLOWED_IMAGE_TYPES,
    );
    if (validationError) throw new Error(validationError);

    const presign = isPublic
      ? await UploadService.presignPublic(file, context)
      : await UploadService.presign(file, context);
    if (!presign.success || !presign.data) {
      throw new Error(presign.error || "Could not start upload");
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
