const CLOUDINARY_CLOUD_NAME = "drly9yba5";
const CLOUDINARY_UPLOAD_PRESET = "civicsense";

/**
 * Uploads a Blob (image) to Cloudinary using an unsigned upload preset.
 * @param blob The image binary data to upload.
 * @returns The secure URL of the uploaded image.
 */
export const uploadToCloudinary = async (blob: Blob): Promise<string> => {
  const formData = new FormData();
  formData.append("file", blob);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Cloudinary Error:", errorData);
    throw new Error(errorData.error?.message || "Cloudinary upload failed");
  }

  const data = await response.json();
  return data.secure_url;
};
