export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const ALLOWED_DOCUMENT_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf"];

export const validateImageFile = (
  file: File,
  allowedTypes: string[] = ALLOWED_IMAGE_TYPES,
): string | null => {
  if (!allowedTypes.includes(file.type)) {
    return allowedTypes === ALLOWED_IMAGE_TYPES
      ? `"${file.name}": only JPEG, PNG and WebP images are allowed`
      : `"${file.name}": only JPEG, PNG, WebP images and PDF files are allowed`;
  }
  if (file.size <= 0) {
    return `"${file.name}" is empty`;
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return `"${file.name}" is too large (5 MB maximum)`;
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
      } else if (xhr.status === 403) {
        reject(
          new Error(
            `Could not upload "${file.name}": permission denied. Please try again.`,
          ),
        );
      } else if (xhr.status === 413) {
        reject(new Error(`"${file.name}" is too large to upload.`));
      } else {
        reject(
          new Error(`Could not upload "${file.name}" (error ${xhr.status}).`),
        );
      }
    };
    // CORS rejections and dropped connections both land here with no status.
    xhr.onerror = () =>
      reject(
        new Error(
          `Could not upload "${file.name}". Check your connection and try again.`,
        ),
      );
    xhr.onabort = () => reject(new Error(`Upload of "${file.name}" was cancelled.`));

    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
