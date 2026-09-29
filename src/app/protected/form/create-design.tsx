import PrimaryButton from "@/src/components/button/PrimaryButton";
import SelectClientModal from "@/src/components/form/order/SelectClientModal";
import { HapticTab } from "@/src/components/haptic-tab";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useUserImage } from "@/src/hooks/useUserImage";
import { getCurrentUserEmail } from "@/src/lib/auth-utils";
import { useDesignStore } from "@/src/stores/designSlice";
import { Client } from "@/src/types/client";
import { validateDesignForm } from "@/src/utils/formValidation";
import { formatPrice, scale, scaleFontSize, spacing } from "@/src/utils/random";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronDown, ChevronLeft, Upload } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CreateDesignScreen = () => {
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  const createDesign = useDesignStore((state) => state.createDesign);
  const loading = useDesignStore((state) => state.loading);

  const { isDark } = useTheme();
  const { top } = useSafeAreaInsets();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : "rgba(54, 65, 83, 1)";
  const labelColor = isDark ? "rgba(160,160,160,1)" : "#4A5565";
  const subLabelColor = isDark ? "rgba(120,120,120,1)" : "#99A1AF";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "white";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : Colors.inputBorder;
  const inputTextColor = isDark ? Colors.text.white : Colors.black;
  const placeholderColor = isDark ? "rgba(100,100,100,1)" : Colors.grayText;
  const dropdownTextColor = isDark ? "rgba(200,200,200,1)" : "rgba(10, 10, 10, 0.5)";
  const chevronColor = isDark ? "rgba(160,160,160,1)" : Colors.grey;
  const imagePickerBorder = isDark ? "rgba(255,255,255,0.1)" : "#D1D5DC";
  const iconCircleBg = isDark ? "rgba(255,255,255,0.08)" : "#F3F4F6";
  const iconColor = isDark ? "rgba(160,160,160,1)" : "#99A1AF";

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientModal, setClientModal] = useState(false);
  const toggleClientModal = () => setClientModal((prev) => !prev);

  const { image, pickImage } = useUserImage({
    returnBase64: false,
    maxWidth: 1024,
    compress: 0.8,
  });

  useEffect(() => {
    if (image) {
      setDesignDetails((prev) => ({
        ...prev,
        imageUrl: image, // local file URI — store uploads it to Cloudinary
      }));
    }
  }, [image]);

  const handlePickImage = async () => {
    try {
      await pickImage();
    } catch (error) {
      console.error("error handling image", error);
    }
  };

  const [designDetails, setDesignDetails] = useState({
    imageUrl: "",
    clientId: clientId ? clientId : "",
    name: "",
    price: "",
    description: "",
    notes: "",
  });

  const [error, setError] = useState({
    imageUrl: "",
    name: "",
    price: "",
    description: "",
    notes: "",
  });

  const handleDetailsChange = (field: keyof typeof designDetails, value: string) => {
    setDesignDetails((prev) => ({ ...prev, [field]: value }));
    if (error[field as keyof typeof error]) {
      setError((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const client = clientId ? clientId : selectedClient ? selectedClient.id : null;

  const handleCreateDesign = async () => {
    const { isValid, errors } = validateDesignForm(designDetails);
    setError(errors);
    if (!isValid || !client) return;
    try {
      const priceNum = parseFloat(designDetails.price.replace(/[^0-9.]/g, "")) || 0;
      await createDesign({
        userEmail: getCurrentUserEmail(),
        name: designDetails.name.trim(),
        price: priceNum,
        description: designDetails.description?.trim() || "",
        notes: designDetails.notes?.trim() || "",
        imageUrl: designDetails.imageUrl,
        clientId: client,
      });
      handleBack();
    } catch (err) {
      console.error("Error creating design", err);
    }
  };

  const handleBack = () => router.replace("/(tabs)/Designs");

  const inputStyle = [
    Styles.input,
    { paddingVertical: 0, paddingHorizontal: spacing(16), backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor },
  ];

  return (
    <>
      <View style={{ flex: 1, paddingTop: top, backgroundColor: bg }}>
        <StatusBar style={isDark ? "light" : "dark"} />

        <View style={styles.header}>
          <HapticTab
            style={styles.backBtn}
            onPress={handleBack}
          >
            <ChevronLeft size={scale(20)} color={isDark ? "rgba(200,200,200,1)" : "rgba(54, 65, 83, 1)"} strokeWidth={1.5} />
          </HapticTab>
          <Text style={[styles.reg24, { color: textColor }]}>Add New Design</Text>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: bg }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? spacing(50) : spacing(0)}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ flexGrow: 1, paddingVertical: spacing(30) }}
            keyboardDismissMode="interactive"
          >
            <View style={styles.content}>
              {!clientId && (
                <View style={Styles.inputContainer}>
                  <Text style={[Styles.label, { color: labelColor }]}>
                    Clients<Text style={styles.red}> *</Text>
                  </Text>
                  <Pressable
                    style={[Styles.input, { ...styles.row, paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder }]}
                    onPress={toggleClientModal}
                  >
                    <Text style={[Styles.reg16, { color: dropdownTextColor }]}>
                      {selectedClient ? selectedClient.name : "Select a Client"}
                    </Text>
                    <ChevronDown size={scale(20)} color={chevronColor} />
                  </Pressable>
                </View>
              )}

              {/* image picker */}
              <View style={[Styles.inputContainer, { gap: spacing(12) }]}>
                <Text style={[styles.reg14, { color: labelColor }]}>
                  Style Image<Text style={styles.red}> *</Text>
                </Text>
                <HapticTab
                  style={[styles.imagePicker, { borderColor: imagePickerBorder }]}
                  onPress={handlePickImage}
                >
                  {image ? (
                    <Image
                      source={{ uri: image }}
                      style={{ width: "100%", height: styles.imagePicker.height, borderRadius: styles.imagePicker.borderRadius }}
                    />
                  ) : (
                    <>
                      <View style={[styles.iconWrapper, { backgroundColor: iconCircleBg }]}>
                        <Upload size={scale(25)} color={iconColor} />
                      </View>
                      <View style={[styles.col, { justifyContent: "center", alignItems: "center" }]}>
                        <Text style={[styles.reg14, { color: labelColor }]}>Click to upload design image</Text>
                        <Text style={[styles.reg12, { color: subLabelColor }]}>PNG, JPG up to 10MB</Text>
                      </View>
                    </>
                  )}
                </HapticTab>
                {error.imageUrl ? (
                  <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.imageUrl}</Text>
                ) : null}
              </View>

              {/* name */}
              <View style={Styles.inputContainer}>
                <Text style={[styles.reg14, { color: labelColor }]}>
                  Design Name<Text style={styles.red}> *</Text>
                </Text>
                <TextInput
                  value={designDetails.name}
                  onChangeText={(text) => handleDetailsChange("name", text)}
                  placeholder="e.g., Ankara Maxi Dress"
                  placeholderTextColor={placeholderColor}
                  returnKeyType="next"
                  keyboardType="default"
                  style={inputStyle}
                />
                {error.name ? (
                  <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.name}</Text>
                ) : null}
              </View>

              {/* price */}
              <View style={Styles.inputContainer}>
                <Text style={[styles.reg14, { color: labelColor }]}>
                  Price (₦)<Text style={styles.red}> *</Text>
                </Text>
                <TextInput
                  value={formatPrice(designDetails.price)}
                  onChangeText={(text) => handleDetailsChange("price", text)}
                  placeholder="e.g., 85000"
                  placeholderTextColor={placeholderColor}
                  returnKeyType="next"
                  keyboardType="numeric"
                  autoCorrect={false}
                  style={inputStyle}
                />
                {error.price ? (
                  <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.price}</Text>
                ) : null}
              </View>

              {/* description */}
              <View style={Styles.inputContainer}>
                <Text style={[styles.reg14, { color: labelColor }]}>Description</Text>
                <TextInput
                  value={designDetails.description}
                  onChangeText={(text) => handleDetailsChange("description", text)}
                  placeholder="Brief description of the design..."
                  placeholderTextColor={placeholderColor}
                  returnKeyType="next"
                  keyboardType="default"
                  style={[Styles.input, { height: 80, textAlignVertical: "top", paddingTop: spacing(15), paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
              </View>

              {/* notes */}
              <View style={Styles.inputContainer}>
                <Text style={[styles.reg14, { color: labelColor }]}>Notes</Text>
                <TextInput
                  value={designDetails.notes}
                  onChangeText={(text) => handleDetailsChange("notes", text)}
                  placeholder="Additional notes, client preferences, special requirements..."
                  placeholderTextColor={placeholderColor}
                  keyboardType="default"
                  style={[Styles.input, { height: 100, textAlignVertical: "top", paddingTop: spacing(15), paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
              </View>

              <View style={[styles.button, { marginTop: spacing(30) }]}>
                <PrimaryButton title="Create Design" onPress={handleCreateDesign} loading={loading} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {clientModal && (
        <SelectClientModal
          visible={clientModal}
          handleOption={(client) => {
            setSelectedClient(client);
            handleDetailsChange("clientId", client.id);
          }}
          onClose={() => setClientModal(false)}
        />
      )}
    </>
  );
};

export default CreateDesignScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing(8),
    paddingHorizontal: spacing(16),
    paddingTop: spacing(12),
    paddingBottom: spacing(8),
  },
  backBtn: {
    width: 32,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  col: { gap: spacing(4) },
  reg12: {
    fontFamily: "regular",
    fontSize: scaleFontSize(12),
  },
  reg14: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
  },
  reg24: {
    fontFamily: "regular",
    fontSize: scaleFontSize(24),
    lineHeight: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    gap: spacing(24),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  red: { color: "rgba(251, 44, 54, 1)" },
  imagePicker: {
    height: 150,
    gap: spacing(12),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
  },
  iconWrapper: {
    width: 63,
    justifyContent: "center",
    alignItems: "center",
    aspectRatio: 1,
    borderRadius: 100,
  },
  button: {
    flex: 1,
    justifyContent: "flex-end",
  },
});
