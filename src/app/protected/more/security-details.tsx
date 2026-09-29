import PrimaryButton from "@/src/components/button/PrimaryButton";
import { HapticTab } from "@/src/components/haptic-tab";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { apiFetch } from "@/src/lib/apiClient";
import { useUserStore } from "@/src/stores/userSlice";
import { scale, scaleFontSize, ShowToastMessage, spacing } from "@/src/utils/random";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AlertCircle, ChevronLeft, Eye, EyeOff } from "lucide-react-native";
import React, { useState } from "react";
import {
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

const SecurityDetailsScreen = () => {
  const user = useUserStore((state) => state.user);
  const { isDark } = useTheme();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const subTextColor = isDark ? "rgba(160,160,160,1)" : Colors.text.gray;
  const headerSubColor = isDark ? "rgba(160,160,160,1)" : "rgba(54, 65, 83, 1)";
  const labelColor = isDark ? "rgba(160,160,160,1)" : Colors.label;
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "white";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : Colors.inputBorder;
  const inputTextColor = isDark ? Colors.text.white : Colors.black;
  const placeholderColor = isDark ? "rgba(100,100,100,1)" : Colors.grayText;
  const tipBg = isDark ? "rgba(22,152,141,0.1)" : "rgba(22,152,141,0.07)";
  const tipBorder = isDark ? "rgba(22,152,141,0.3)" : "rgba(22,152,141,0.2)";
  const errorBg = isDark ? "rgba(231,0,11,0.1)" : "rgba(254,242,242,1)";
  const successBg = isDark ? "rgba(22,152,141,0.12)" : "rgba(22,152,141,0.08)";

  // ── Form state ──────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ── Visibility toggles ───────────────────────────────────────────────────
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── State ────────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const clearError = (field: string) =>
    setErrors((prev) => ({ ...prev, [field]: "" }));

  // ── Validation — mirrors web exactly ────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};

    if (!currentPassword)
      e.currentPassword = "Current password is required";

    if (!newPassword)
      e.newPassword = "New password is required";
    else if (newPassword.length < 6)
      e.newPassword = "Password must be at least 6 characters";
    else if (newPassword === currentPassword)
      e.newPassword = "New password must be different from current password";

    if (!confirmPassword)
      e.confirmPassword = "Please confirm your new password";
    else if (newPassword !== confirmPassword)
      e.confirmPassword = "Passwords do not match";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!validate()) return;

    setSaving(true);
    setErrors({});
    setSuccessMessage("");

    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage("Password updated successfully!");

      ShowToastMessage({ title: "Password updated", preset: "done", haptic: "success" });

      setTimeout(() => {
        setSuccessMessage("");
        router.replace("/(tabs)/More");
      }, 2000);
    } catch (err: any) {
      const msg: string = err.message ?? "Failed to update password";
      if (msg.toLowerCase().includes("current password")) {
        setErrors({ currentPassword: msg });
      } else {
        setErrors({ general: msg });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => router.replace("/(tabs)/More");

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
          <Text style={[styles.reg24, { color: textColor }]}>Security</Text>
          <Text style={[Styles.reg14, { color: headerSubColor }]}>
            Manage password & authentication
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

            {/* ── General error banner ── */}
            {errors.general ? (
              <View style={[styles.banner, { backgroundColor: errorBg }]}>
                <AlertCircle size={scale(15)} color="rgba(185,28,28,1)" />
                <Text style={[styles.bannerText, { color: "rgba(185,28,28,1)" }]}>
                  {errors.general}
                </Text>
              </View>
            ) : null}

            {/* ── Success banner ── */}
            {successMessage ? (
              <View style={[styles.banner, { backgroundColor: successBg }]}>
                <Text style={[styles.bannerText, { color: Colors.primary }]}>
                  {successMessage}
                </Text>
              </View>
            ) : null}

            {/* ── Change Password section ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Change Password
              </Text>

              <View style={styles.inputs}>
                {/* Current Password */}
                <View style={Styles.inputContainer}>
                  <Text style={[Styles.label, { color: labelColor }]}>Current Password</Text>
                  <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                    <TextInput
                      value={currentPassword}
                      onChangeText={(t) => { setCurrentPassword(t); clearError("currentPassword"); }}
                      placeholder="Enter current password"
                      placeholderTextColor={placeholderColor}
                      secureTextEntry={!showCurrent}
                      autoCorrect={false}
                      autoCapitalize="none"
                      returnKeyType="next"
                      style={[styles.inputField, { color: inputTextColor }]}
                    />
                    <Pressable hitSlop={8} onPress={() => setShowCurrent((p) => !p)}>
                      {showCurrent
                        ? <EyeOff size={scale(18)} color={placeholderColor} />
                        : <Eye size={scale(18)} color={placeholderColor} />}
                    </Pressable>
                  </View>
                  {errors.currentPassword ? (
                    <Text style={styles.errorText}>{errors.currentPassword}</Text>
                  ) : null}
                </View>

                {/* New Password */}
                <View style={Styles.inputContainer}>
                  <Text style={[Styles.label, { color: labelColor }]}>New Password</Text>
                  <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                    <TextInput
                      value={newPassword}
                      onChangeText={(t) => { setNewPassword(t); clearError("newPassword"); }}
                      placeholder="Enter new password"
                      placeholderTextColor={placeholderColor}
                      secureTextEntry={!showNew}
                      autoCorrect={false}
                      autoCapitalize="none"
                      returnKeyType="next"
                      style={[styles.inputField, { color: inputTextColor }]}
                    />
                    <Pressable hitSlop={8} onPress={() => setShowNew((p) => !p)}>
                      {showNew
                        ? <EyeOff size={scale(18)} color={placeholderColor} />
                        : <Eye size={scale(18)} color={placeholderColor} />}
                    </Pressable>
                  </View>
                  {errors.newPassword ? (
                    <Text style={styles.errorText}>{errors.newPassword}</Text>
                  ) : null}
                </View>

                {/* Confirm Password */}
                <View style={Styles.inputContainer}>
                  <Text style={[Styles.label, { color: labelColor }]}>Confirm New Password</Text>
                  <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={(t) => { setConfirmPassword(t); clearError("confirmPassword"); }}
                      placeholder="Confirm new password"
                      placeholderTextColor={placeholderColor}
                      secureTextEntry={!showConfirm}
                      autoCorrect={false}
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleUpdate}
                      style={[styles.inputField, { color: inputTextColor }]}
                    />
                    <Pressable hitSlop={8} onPress={() => setShowConfirm((p) => !p)}>
                      {showConfirm
                        ? <EyeOff size={scale(18)} color={placeholderColor} />
                        : <Eye size={scale(18)} color={placeholderColor} />}
                    </Pressable>
                  </View>
                  {errors.confirmPassword ? (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  ) : null}
                </View>
              </View>

              <PrimaryButton
                title="Update Password"
                onPress={handleUpdate}
                loading={saving}
                props={{ disabled: saving }}
              />
            </View>

            {/* ── Security tip ── */}
            <View style={[styles.tip, { backgroundColor: tipBg, borderColor: tipBorder }]}>
              <AlertCircle size={scale(18)} color={Colors.primary} />
              <View style={{ flex: 1, gap: spacing(4) }}>
                <Text style={[styles.tipTitle, { color: Colors.primary }]}>Security Tip</Text>
                <Text style={[styles.tipText, { color: subTextColor }]}>
                  Use a strong password with at least 6 characters, including
                  uppercase, lowercase, numbers, and symbols.
                </Text>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SecurityDetailsScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: spacing(8),
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(6),
  },
  col: { gap: spacing(4) },
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
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(8),
    padding: spacing(12),
    borderRadius: 12,
  },
  bannerText: {
    fontFamily: "regular",
    fontSize: scaleFontSize(13),
    flex: 1,
    lineHeight: 18,
  },
  section: {
    gap: spacing(20),
  },
  sectionTitle: {
    fontFamily: "medium",
    fontSize: scaleFontSize(16),
  },
  inputs: {
    gap: spacing(16),
  },
  // Password input with show/hide button inline
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing(16),
    height: 48,
  },
  inputField: {
    flex: 1,
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
    height: "100%",
  },
  errorText: {
    fontFamily: "regular",
    fontSize: scaleFontSize(12),
    color: "red",
    marginTop: spacing(4),
  },
  tip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing(10),
    padding: spacing(14),
    borderRadius: 14,
    borderWidth: 1,
  },
  tipTitle: {
    fontFamily: "medium",
    fontSize: scaleFontSize(13),
  },
  tipText: {
    fontFamily: "regular",
    fontSize: scaleFontSize(12),
    lineHeight: 18,
  },
});
