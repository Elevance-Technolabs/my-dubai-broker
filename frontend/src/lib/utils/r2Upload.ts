export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const ALLOWED_DOCUMENT_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf"];

export const validateImageFile = (
  file: File,
  allowedTypes: string[] = ALLOWED_IMAGE_TYPES,
): string | null => {
  if (!allowedTypes.includes(file.type)) {
    return allowedTypes === ALLOWED_IMAGE_TYPES
      ? "Only JPEG, PNG and WebP images are allowed"
      : "Only JPEG, PNG, WebP images and PDF files are allowed";
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
    return "Image must be 5 MB or smaller";
  }
  return null;
};

export const putFileToR2 = (
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));

    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
