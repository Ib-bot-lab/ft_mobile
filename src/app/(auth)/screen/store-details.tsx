import PrimaryButton from "@/src/components/button/PrimaryButton";
import { HapticTab } from "@/src/components/haptic-tab";
import CountryModal from "@/src/components/shared/modal/CountryModal";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { Roles, RolesType } from "@/src/constants/data";
import { useUserImage } from "@/src/hooks/useUserImage";
import { useAuthStore } from "@/src/stores/authSlice";
import { scale, scaleFontSize, spacing } from "@/src/utils/random";
import { router } from "expo-router";
import { ChevronDown, MoveLeft, Upload } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const StoreDetailsScreen = () => {
  const { top: statusBarHeight } = useSafeAreaInsets();
  const { isDark } = useTheme();

  const bg = isDark ? "#151718" : "white";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const labelColor = isDark ? "rgba(180,180,180,1)" : Colors.label;
  const inputBg = isDark ? "rgba(30,30,30,1)" : "white";
  const inputBorder = isDark ? "rgba(60,60,60,1)" : Colors.inputBorder;
  const placeholderColor = isDark ? "rgba(100,100,100,1)" : Colors.grayText;
  const imagePickerBg = isDark ? "rgba(40,40,40,1)" : "#F2F2F2";
  const imagePickerBorder = isDark ? "rgba(70,70,70,1)" : "#D1D5DC";

  const [selectedRole, setSelectedRole] = useState<RolesType>("Designer");
  const [showCountry, setShowCountry] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("Nigeria");

  const { image, pickImage } = useUserImage({ returnBase64: false, maxWidth: 256, compress: 0.4 });

  const [error, setError] = useState({ businessName: "", country: "", logo: "" });

  const userData = useAuthStore((state) => state.userData);
  const updateUserData = useAuthStore((state) => state.updateUserData);

  const handleDataChange = (field: keyof typeof userData, value: string) => {
    updateUserData({ ...userData, [field]: value });
    if (error[field as keyof typeof error]) {
      setError((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Sync default country into userData on mount
  useEffect(() => {
    if (!userData.country) handleDataChange("country", "Nigeria");
  }, []);

  // Store raw base64 — Cloudinary upload happens on "Launch Account"
  useEffect(() => {
    if (image) handleDataChange("logo", image);
  }, [image]);

  const validateForm = () => {
    const newErrors = { businessName: "", country: "", logo: "" };
    let isValid = true;
    if (!userData.businessName?.trim() && userData.businessName.length < 5) {
      newErrors.businessName = "Store name is required";
      isValid = false;
    }
    if (!userData.logo) {
      newErrors.logo = "Logo image is required";
      isValid = false;
    }
    setError(newErrors);
    return isValid;
  };

  const handleContinue = () => {
    if (validateForm()) {
      router.push("/(auth)/screen/create-password");
    } else {
      Alert.alert("Validation Error", "Please fix the errors in the form before continuing.", [{ text: "OK" }]);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.primary }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? spacing(50) : spacing(0)}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardDismissMode="interactive"
        >
          <ImageBackground
            source={require("@/assets/images/screen_bg.png")}
            style={[styles.headerBg, { paddingTop: statusBarHeight + spacing(20) }]}
          >
            <View style={styles.headerContent}>
              <HapticTab onPress={() => router.back()} hitSlop={20} style={{ paddingVertical: spacing(8) }}>
                <MoveLeft size={scale(20)} color={"white"} />
              </HapticTab>
              <Text style={[Styles.sm15, { color: Colors.secondary }]}>Step 3 Of 4</Text>
              <View style={styles.col}>
                <Text style={Styles.bold32}>One Platform.{"\n"}Powering Business Growth</Text>
                <Text style={Styles.reg14}>Time to set up your Store.</Text>
              </View>
              <Text style={Styles.bold12}>
                Already have an account?{"  "}
                <Text
                  style={[Styles.med16, { color: Colors.secondary, textDecorationLine: "underline" }]}
                  onPress={() => router.push("/sign-in")}
                >
                  Sign in
                </Text>
              </Text>
            </View>
          </ImageBackground>

          <View
            style={{
              flex: 1,
              backgroundColor: bg,
              marginTop: -30,
              borderTopRightRadius: 30,
              borderTopLeftRadius: 30,
              paddingBottom: spacing(30),
            }}
          >
            <View style={styles.content}>
              <View style={styles.inputsWrapper}>
                <View style={Styles.inputContainer}>
                  <Text style={[Styles.label, { color: labelColor }]}>I am a:</Text>
                  <View style={[styles.row, { gap: spacing(15) }]}>
                    {Roles.map((role, index) => (
                      <HapticTab
                        style={[
                          styles.roleBtn,
                          selectedRole === role.value
                            ? styles.roleSelected
                            : [styles.borderBtn, { borderColor: isDark ? "rgba(70,70,70,1)" : Colors.iconGrey }],
                        ]}
                        onPress={() => setSelectedRole(role.value as any)}
                        key={index}
                      >
                        <Text
                          style={[
                            Styles.med12,
                            { color: selectedRole === role.value ? Colors.text.white : textColor },
                          ]}
                        >
                          {role.label}
                        </Text>
                      </HapticTab>
                    ))}
                  </View>
                </View>

                <View style={Styles.inputContainer}>
                  <Text style={[Styles.label, { color: labelColor }]}>
                    Store Name<Text style={styles.red}> *</Text>
                  </Text>
                  <TextInput
                    value={userData.businessName}
                    onChangeText={(value) => handleDataChange("businessName", value)}
                    placeholder="Enter your store name"
                    placeholderTextColor={placeholderColor}
                    textContentType="name"
                    returnKeyType="next"
                    style={[Styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                  />
                  {error.businessName ? (
                    <Text style={Styles.errorText}>{error.businessName}</Text>
                  ) : null}
                </View>

                <View style={[Styles.inputContainer, { gap: spacing(12) }]}>
                  <Text style={[styles.reg14, { color: labelColor }]}>
                    Logo<Text style={styles.red}> *</Text>
                  </Text>
                  <HapticTab
                    style={[styles.imagePicker, { backgroundColor: imagePickerBg, borderColor: imagePickerBorder }]}
                    onPress={async () => { try { await pickImage(); } catch (e) { console.error(e); } }}
                  >
                    {image ? (
                      <Image
                        source={{ uri: image }}
                        style={{ width: "100%", height: styles.imagePicker.height, borderRadius: styles.imagePicker.borderRadius }}
                      />
                    ) : (
                      <>
                        <Upload size={scale(20)} color={isDark ? "rgba(150,150,150,1)" : "#99A1AF"} />
                        <Text style={[styles.reg14, { color: isDark ? "rgba(150,150,150,1)" : "#4A5565" }]}>
                          Click to Select Favicon
                        </Text>
                      </>
                    )}
                  </HapticTab>
                  {error.logo ? (
                    <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.logo}</Text>
                  ) : null}
                </View>

                <View style={Styles.inputContainer}>
                  <Text style={[Styles.label, { color: labelColor }]}>Country</Text>
                  <TouchableOpacity
                    onPress={() => setShowCountry(true)}
                    style={[
                      Styles.input,
                      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: inputBg, borderColor: inputBorder },
                    ]}
                  >
                    <Text style={[styles.textBtn, { color: textColor }]}>{selectedCountry}</Text>
                    <ChevronDown size={scale(12)} color={textColor} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.footer}>
                <PrimaryButton title="Continue" onPress={handleContinue} />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showCountry && (
        <CountryModal
          visible={showCountry}
          onClose={() => setShowCountry(false)}
          handleOption={(country) => {
            setSelectedCountry(country);
            handleDataChange("country", country);
          }}
        />
      )}
    </>
  );
};

export default StoreDetailsScreen;

const styles = StyleSheet.create({
  headerBg: {
    backgroundColor: Colors.primary,
    padding: spacing(16),
    paddingBottom: spacing(50),
  },
  headerContent: {
    gap: spacing(12),
  },
  col: { gap: spacing(4) },
  content: {
    flex: 1,
    paddingHorizontal: spacing(16),
    gap: spacing(32),
  },
  inputsWrapper: {
    gap: spacing(16),
    paddingTop: spacing(50),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roleBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  roleSelected: { backgroundColor: Colors.primary },
  borderBtn: { borderWidth: 1 },
  textBtn: { fontFamily: "regular" },
  reg14: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
  },
  red: { color: "rgba(251, 44, 54, 1)" },
  imagePicker: {
    height: 100,
    gap: spacing(12),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
  },
  footer: { paddingTop: spacing(8) },
});
