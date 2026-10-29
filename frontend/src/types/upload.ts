export type UploadContext =
  | "listing-photo"
  | "company-logo"
  | "company-cover"
  | "company-listing-logo"
  | "company-document"
  | "product-image";

export interface PresignedUpload {
  uploadId: string;
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

export interface UploadResult {
  uploadId: string;
  key: string;
}
