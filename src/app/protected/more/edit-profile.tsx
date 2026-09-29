import PrimaryButton from "@/src/components/button/PrimaryButton";
import { HapticTab } from "@/src/components/haptic-tab";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import {
  apiFetch,
  AUTH_USER_KEY,
  getStoredToken,
} from "@/src/lib/apiClient";
import { useUserStore } from "@/src/stores/userSlice";
import {
  GetInitials,
  scale,
  scaleFontSize,
  ShowToastMessage,
  spacing,
} from "@/src/utils/random";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Camera, ChevronLeft } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Cloudinary upload helper ────────────────────────────────────────────────
async function uploadToCloudinary(uri: string): Promise<string> {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const formData = new FormData();
  // @ts-ignore — React Native FormData accepts this object shape
  formData.append("file", { uri, type: "image/jpeg", name: "profile.jpg" });
  formData.append("upload_preset", preset!);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData },
  );
  const data = await res.json();
  if (!res.ok || !data.secure_url) {
    throw new Error(data?.error?.message ?? "Cloudinary upload failed");
  }
  return data.secure_url as string;
}

// ─── Component ───────────────────────────────────────────────────────────────
const EditProfileScreen = () => {
  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);

  const { isDark } = useTheme();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : "rgba(54, 65, 83, 1)";
  const subTextColor = isDark ? "rgba(160,160,160,1)" : "rgba(54, 65, 83, 1)";
  const labelColor = isDark ? "rgba(160,160,160,1)" : Colors.label;
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "white";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : Colors.inputBorder;
  const inputTextColor = isDark ? Colors.text.white : Colors.black;
  const placeholderColor = isDark ? "rgba(100,100,100,1)" : Colors.grayText;
  const disabledBg = isDark
    ? "rgba(255,255,255,0.04)"
    : "rgba(0,0,0,0.04)";
  const cameraBtnBg = isDark
    ? "rgba(22,152,141,0.9)"
    : "rgba(22,152,141,1)";

  // ── Form state ──────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [lga, setLga] = useState("");
  const [state, setState] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState<string>("");

  // ── Loading flags ────────────────────────────────────────────────────────
  const [initialLoading, setInitialLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Seed form from backend on mount ─────────────────────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: any }>(
          "/user/get",
        );
        const d = res.data;
        setFirstName(d.name?.split(" ")[0] ?? "");
        setLastName(d.name?.split(" ").slice(1).join(" ") ?? "");
        setPhone(d.phone ?? d.phoneNumber ?? "");
        setLga(d.lga ?? "");
        setState(d.state ?? "");
        setBio(d.bio ?? "");
        setPhotoURL(d.photoURL ?? "");
      } catch {
        // Fall back to the locally stored user if backend is unreachable
        if (user) {
          setFirstName(user.name?.split(" ")[0] ?? "");
          setLastName(user.name?.split(" ").slice(1).join(" ") ?? "");
          setPhone(user.phone ?? user.phoneNumber ?? "");
          setLga(user.lga ?? "");
          setState(user.state ?? "");
          setBio((user as any).bio ?? "");
          setPhotoURL((user as any).photoURL ?? "");
        }
      } finally {
        setInitialLoading(false);
      }
    };
    loadProfile();
  }, []);

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "First name is required";
    if (!phone.trim()) e.phone = "Phone number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Image picker → Cloudinary ────────────────────────────────────────────
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const uri = result.assets[0].uri;
    try {
      setImageUploading(true);
      const url = await uploadToCloudinary(uri);
      setPhotoURL(url);
      ShowToastMessage({
        title: "Photo uploaded",
        preset: "done",
        haptic: "success",
      });
    } catch (err: any) {
      ShowToastMessage({
        title: "Photo upload failed",
        message: err.message,
        preset: "error",
        haptic: "error",
      });
    } finally {
      setImageUploading(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

      const payload = {
        name: fullName,
        displayName: fullName,
        phone: phone.trim(),
        phoneNumber: phone.trim(),
        lga: lga.trim(),
        state: state.trim(),
        bio: bio.trim(),
        photoURL,
        updatedAt: new Date().toISOString(),
      };

      const res = await apiFetch<{ success: boolean; data: any }>(
        "/user/edit",
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );

      // Persist updated user in AsyncStorage so next app start is correct
      const updatedUser = { ...user, ...res.data };
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));

      // Update Zustand store so the rest of the app reflects the change
      updateUser(updatedUser);

      ShowToastMessage({
        title: "Profile updated",
        preset: "done",
        haptic: "success",
      });
      router.replace("/(tabs)/More");
    } catch (err: any) {
      ShowToastMessage({
        title: "Update failed",
        message: err.message,
        preset: "error",
        haptic: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => router.replace("/(tabs)/More");

  const displayName = `${firstName} ${lastName}`.trim();

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <SafeAreaView
        edges={["left", "right", "bottom"]}
        style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.reg14, { color: subTextColor, marginTop: spacing(12) }]}>
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={{ flex: 1, paddingTop: spacing(20), backgroundColor: bg }}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <HapticTab
          style={{ width: 32, aspectRatio: 1, justifyContent: "center", alignItems: "center" }}
          onPress={handleBack}
        >
          <ChevronLeft
            size={scale(20)}
            color={isDark ? "rgba(200,200,200,1)" : "rgba(54, 65, 83, 1)"}
            strokeWidth={1.5}
          />
        </HapticTab>
        <View style={styles.col}>
          <Text style={[styles.reg24, { color: textColor }]}>Profile</Text>
          <Text style={[Styles.reg14, { color: subTextColor }]}>
            Update your personal information
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: bg }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? spacing(50) : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ flexGrow: 1, paddingVertical: spacing(30) }}
          keyboardDismissMode="interactive"
        >
          <View style={styles.content}>
            {/* ── Avatar ── */}
            <View style={styles.avatarWrapper}>
              {photoURL ? (
                <Image source={{ uri: photoURL }} style={styles.avatarImage} />
              ) : (
                <LinearGradient
                  colors={["rgba(22, 152, 141, 1)", "rgba(13, 107, 98, 1)"]}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.reg30}>{GetInitials(displayName)}</Text>
                </LinearGradient>
              )}

              {/* Camera button overlay */}
              <Pressable
                style={[styles.cameraBtn, { backgroundColor: cameraBtnBg }]}
                onPress={handlePickImage}
                disabled={imageUploading}
              >
                {imageUploading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Camera size={scale(14)} color="white" />
                )}
              </Pressable>
            </View>

            <Text style={[styles.avatarHint, { color: placeholderColor }]}>
              Tap the camera icon to change your photo
            </Text>

            {/* ── Sub-admin badge ── */}
            {user?.isAdmin && user?.invitedBy ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Team Member</Text>
              </View>
            ) : null}

            {/* ── Inputs ── */}
            <View style={styles.inputs}>
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>First Name</Text>
                <TextInput
                  value={firstName}
                  onChangeText={(t) => {
                    setFirstName(t);
                    setErrors((p) => ({ ...p, firstName: "" }));
                  }}
                  placeholder="First Name"
                  placeholderTextColor={placeholderColor}
                  textContentType="givenName"
                  returnKeyType="next"
                  autoCorrect={false}
                  style={[Styles.input, { paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
                {errors.firstName ? (
                  <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>
                    {errors.firstName}
                  </Text>
                ) : null}
              </View>

              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Last Name</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last Name"
                  placeholderTextColor={placeholderColor}
                  textContentType="familyName"
                  returnKeyType="next"
                  autoCorrect={false}
                  style={[Styles.input, { paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
              </View>

              {/* Email — read-only */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Email Address</Text>
                <View
                  style={[
                    Styles.input2,
                    { opacity: isDark ? 0.3 : 0.4, paddingVertical: 0, backgroundColor: disabledBg, borderColor: inputBorder },
                  ]}
                >
                  <Text style={[Styles.reg12, { color: inputTextColor }]}>
                    {user?.email ?? ""}
                  </Text>
                </View>
                <Text style={[styles.helperText, { color: placeholderColor }]}>
                  Email cannot be changed
                </Text>
              </View>

              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Phone Number</Text>
                <TextInput
                  value={phone}
                  onChangeText={(t) => {
                    setPhone(t);
                    setErrors((p) => ({ ...p, phone: "" }));
                  }}
                  placeholder="+234 800 000 0000"
                  placeholderTextColor={placeholderColor}
                  textContentType="telephoneNumber"
                  returnKeyType="next"
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  maxLength={14}
                  style={[Styles.input, { paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
                {errors.phone ? (
                  <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>
                    {errors.phone}
                  </Text>
                ) : null}
              </View>

              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>LGA / City</Text>
                <TextInput
                  value={lga}
                  onChangeText={setLga}
                  placeholder="Local Government Area"
                  placeholderTextColor={placeholderColor}
                  textContentType="addressCity"
                  returnKeyType="next"
                  autoCorrect={false}
                  style={[Styles.input, { paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
              </View>

              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>State</Text>
                <TextInput
                  value={state}
                  onChangeText={setState}
                  placeholder="State"
                  placeholderTextColor={placeholderColor}
                  textContentType="addressState"
                  returnKeyType="next"
                  autoCorrect={false}
                  style={[Styles.input, { paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
              </View>

              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Bio</Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={placeholderColor}
                  returnKeyType="done"
                  multiline
                  numberOfLines={4}
                  autoCorrect={false}
                  style={[
                    Styles.input,
                    {
                      paddingVertical: spacing(10),
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
                      paddingHorizontal: spacing(16),
                      color: inputTextColor,
                      minHeight: 100,
                      textAlignVertical: "top",
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.button}>
              <PrimaryButton
                title="Save Changes"
                onPress={handleSave}
                loading={saving || imageUploading}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: spacing(8),
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(6),
  },
  col: {
    gap: spacing(4),
  },
  reg24: {
    fontFamily: "regular",
    fontSize: scaleFontSize(24),
    lineHeight: 32,
  },
  reg30: {
    fontFamily: "regular",
    fontSize: scaleFontSize(30),
    color: "white",
    lineHeight: 36,
  },
  reg14: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    gap: spacing(20),
  },
  avatarWrapper: {
    alignSelf: "center",
    position: "relative",
  },
  avatarGradient: {
    width: 90,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 100,
  },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarHint: {
    alignSelf: "center",
    fontFamily: "regular",
    fontSize: scaleFontSize(12),
    marginTop: spacing(-12),
  },
  badge: {
    alignSelf: "center",
    backgroundColor: Colors.plight,
    borderRadius: 20,
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(4),
  },
  badgeText: {
    fontFamily: "medium",
    fontSize: scaleFontSize(12),
    color: Colors.primary,
  },
  inputs: {
    flex: 1,
    gap: spacing(16),
  },
  helperText: {
    fontFamily: "regular",
    fontSize: scaleFontSize(11),
    marginTop: spacing(4),
  },
  button: {},
});
