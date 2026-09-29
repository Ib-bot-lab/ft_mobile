import { ShowToastMessage } from "./random";

export const uploadImageToCloudinary = async (
  base64: string,
): Promise<string | null> => {
  try {
    if (base64.startsWith("https")) return base64;
    if (!base64) return null;

    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const folder = process.env.EXPO_PUBLIC_CLOUDINARY_FOLDER;

    const formData = new FormData();

    const fileData = base64.startsWith("data:image")
      ? base64
      : `data:image/jpeg;base64,${base64}`;

    formData.append("file", fileData);
    formData.append("upload_preset", preset!);
    formData.append("folder", folder!);

    console.log("form data", formData);

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

    const res = await fetch(url, {
      method: "POST",
      body: formData,
      // headers: {
      //   Accept: "application/json",
      // },
    });

    const data = await res.json();

    if (!res.ok) {
      console.log("Cloudinary Error Detail:", data);
      ShowToastMessage({
        title: "Upload failed",
        message: data?.error?.message || "Check your preset settings",
        preset: "error",
        from: "top",
      });
      return null;
    }

    return data.secure_url;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return null;
  }
};
