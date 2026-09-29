import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

type UseUserImageOptions = {
  maxWidth?: number;
  compress?: number;
  returnBase64?: boolean;
};

export const useUserImage = ({
  maxWidth = 512,
  compress = 0.7,
  returnBase64 = false,
}: UseUserImageOptions = {}) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    setError(null);
    setLoading(true);

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new Error("Permission denied");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const asset = result.assets[0];

      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: maxWidth } }],
        {
          compress,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: returnBase64,
        },
      );

      setImage(returnBase64 ? manipulated.base64! : manipulated.uri);
    } catch (err) {
      console.error(err);
      setError("Failed to pick image");
    } finally {
      setLoading(false);
    }
  };

  const getImageUri = (base64?: string) => {
    if (base64 && base64.startsWith("https")) return base64;
    if (!base64) return undefined;

    // already a data URI → return as-is
    if (base64.startsWith("data:image")) {
      return base64;
    }

    // raw base64 → wrap it
    return `data:image/jpeg;base64,${base64}`;
  };

  const clearImage = () => setImage(null);

  return {
    image,
    loading,
    error,
    pickImage,
    clearImage,
    getImageUri,
  };
};
