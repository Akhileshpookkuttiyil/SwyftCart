import { v2 as cloudinary } from "cloudinary";
import { AppError } from "./api-response";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImagesToCloudinary = async (files) => {
  if (!Array.isArray(files) || !files.length) {
    throw new AppError("At least one image is required", 400);
  }

  return Promise.all(
    files.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto" },
          (error, result) => {
            if (error || !result?.secure_url) {
              reject(error || new Error("Image upload failed"));
              return;
            }

            resolve(result.secure_url);
          }
        );

        stream.end(buffer);
      });
    })
  );
};
