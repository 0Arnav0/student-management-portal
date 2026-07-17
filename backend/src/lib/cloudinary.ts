import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { env } from "./env.js";

const CLOUDINARY_FOLDER = "student-management/photos";

export interface UploadResult {
  url: string;
  publicId: string;
}

export function uploadPhoto(buffer: Buffer): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: CLOUDINARY_FOLDER, resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );
    stream.end(buffer);
  });
}

export function deletePhoto(publicId: string | null | undefined): Promise<any> {
  if (!publicId) return Promise.resolve();
  return cloudinary.uploader.destroy(publicId);
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(env.CLOUDINARY_URL);
}
