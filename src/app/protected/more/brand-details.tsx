import PrimaryButton from "@/src/components/button/PrimaryButton";
import { HapticTab } from "@/src/components/haptic-tab";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { apiFetch, API_BASE_URL } from "@/src/lib/apiClient";
import { useUserStore } from "@/src/stores/userSlice";
import { BrandSettings } from "@/src/types/auth";
import {
  emptyBrandSettings,
  sanitizeBrandSettings,
  scale,
  scaleFontSize,
  ShowToastMessage,
  spacing,
} from "@/src/utils/random";
import { uploadImageToCloudinary } from "@/src/utils/uploadImageToCloudinary";
import { useUserImage } from "@/src/hooks/useUserImage";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Pencil } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Validation ───────────────────────────────────────────────────────────────
const validateBrandSettings = (data: BrandSettings) => {
  const nextError = emptyBrandSettings("");

  if (!data.businessName.trim())
    nextError.businessName = "Business name is required";

  if (!data.businessAddress?.trim())
    nextError.businessAddress = "Business address is required";

  if (!data.businessPhone?.trim())
    nextError.businessPhone = "Phone number is required";

  if (!data.businessEmail?.trim()) {
    nextError.businessEmail = "Email address is required";
  } else if (!/\S+@\S+\.\S+/.test(data.businessEmail)) {
    nextError.businessEmail = "Email address is invalid";
  }

  const website = data.businessWebsite?.trim();
  if (
    website &&
    !/^(https?:\/\/)?(www\.)?[a-z0-9-]+\.[a-z]{2,}(\.[a-z]{2,})?([\/?#].*)?$/i.test(
      website,
    )
  ) {
    nextError.businessWebsite = "Enter a valid website (e.g. www.example.com)";
  }

  return nextError;
};

const hasErrors = (err: BrandSettings) =>
  Object.entries(err).some(
    ([key, val]) =>
      !["userEmail", "updatedAt", "primaryColor", "secondaryColor"].includes(key) &&
      Boolean((val as string)?.trim()),
  );

// ─── Component ────────────────────────────────────────────────────────────────
const BrandDetailsScreen = () => {
  const user = useUserStore((state) => state.user);
  const storeBrandSetting = useUserStore((state) => state.brandSetting);
  const setStoreBrand = useUserStore((state) => state.editBrandSettings);

  const { isDark } = useTheme();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : "rgba(54, 65, 83, 1)";
  const subTextColor = isDark ? "rgba(160,160,160,1)" : "rgba(54, 65, 83, 1)";
  const labelColor = isDark ? "rgba(160,160,160,1)" : Colors.label;
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "white";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : Colors.inputBorder;
  const inputTextColor = isDark ? Colors.text.white : Colors.black;
  const placeholderColor = isDark ? "rgba(100,100,100,1)" : Colors.grayText;
  const imageBorder = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.8)";
  const sectionLabelColor = isDark ? "rgba(180,180,180,1)" : "rgba(74, 85, 101, 1)";
  const dividerColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";

  const effectiveEmail =
    user?.isAdmin && user?.invitedBy ? user.invitedBy : (user?.email ?? "");

  // ── Form state ──────────────────────────────────────────────────────────
  const [form, setForm] = useState<BrandSettings>(() =>
    sanitizeBrandSettings({ userEmail: effectiveEmail }),
  );
  const [error, setError] = useState<BrandSettings>(() =>
    emptyBrandSettings(""),
  );

  // ── Loading flags ────────────────────────────────────────────────────────
  const [initialLoading, setInitialLoading] = useState(true);
  const [logoUploading, setLogoUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { image, pickImage, getImageUri } = useUserImage({
    returnBase64: true,
    maxWidth: 256,
    compress: 0.4,
  });

  // ── Sync new picked image into form ─────────────────────────────────────
  useEffect(() => {
    if (image) setForm((prev) => ({ ...prev, logoUrl: image }));
  }, [image]);

  // ── Load brand data from backend on mount ────────────────────────────────
  useEffect(() => {
    const loadBrand = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/brand-setting/get-by-email/${encodeURIComponent(effectiveEmail)}`,
        );
        const data = await res.json();
        if (data.success && data.data) {
          setForm(sanitizeBrandSettings({ ...data.data, userEmail: effectiveEmail }));
        } else if (storeBrandSetting) {
          // Fall back to cached store data
          setForm(sanitizeBrandSettings({ ...storeBrandSetting, userEmail: effectiveEmail }));
        }
      } catch {
        // Network error — fall back to store cache
        if (storeBrandSetting) {
          setForm(sanitizeBrandSettings({ ...storeBrandSetting, userEmail: effectiveEmail }));
        }
      } finally {
        setInitialLoading(false);
      }
    };
    loadBrand();
  }, []);

  const handleChange = (field: keyof BrandSettings, value: string) => {
    setForm((prev) => sanitizeBrandSettings({ ...prev, [field]: value }));
    if (error[field as keyof typeof error]) {
      setError((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const clean = sanitizeBrandSettings(form);

    const nextError = validateBrandSettings(clean);
    setError(nextError);
    if (hasErrors(nextError)) {
      ShowToastMessage({ title: "Please fix the errors", preset: "error", haptic: "error" });
      return;
    }

    setSaving(true);
    try {
      // Upload logo if it's a local file / base64
      let finalLogoUrl = clean.logoUrl ?? "";
      if (
        finalLogoUrl &&
        (finalLogoUrl.startsWith("data:") || finalLogoUrl.startsWith("file:"))
      ) {
        setLogoUploading(true);
        const uploaded = await uploadImageToCloudinary(finalLogoUrl);
        setLogoUploading(false);
        if (uploaded) finalLogoUrl = uploaded;
      }

      const payload = sanitizeBrandSettings({
        ...clean,
        id: effectiveEmail,
        userEmail: effectiveEmail,
        logoUrl: finalLogoUrl,
        updatedAt: new Date().toISOString(),
      });

      // Try edit first — fall back to create if the doc doesn't exist yet
      // (matches exact web logic)
      let success = false;
      try {
        const editRes = await apiFetch<{ success: boolean; data: any }>(
          `/brand-setting/edit/${encodeURIComponent(effectiveEmail)}`,
          { method: "PUT", body: JSON.stringify(payload) },
        );
        success = editRes.success;
      } catch {
        // edit threw (404 → brand not created yet) — create it
        const createRes = await apiFetch<{ success: boolean; data: any }>(
          "/brand-setting/create",
          { method: "POST", body: JSON.stringify(payload) },
        );
        success = createRes.success;
      }

      if (success) {
        // Sync the Zustand store so the rest of the app is up to date
        await setStoreBrand(payload);
        ShowToastMessage({ title: "Brand settings saved", preset: "done", haptic: "success" });
        router.replace("/(tabs)/More");
      } else {
        ShowToastMessage({ title: "Update failed", preset: "error", haptic: "error" });
      }
    } catch (err: any) {
      ShowToastMessage({
        title: "Update failed",
        message: err.message,
        preset: "error",
        haptic: "error",
      });
    } finally {
      setSaving(false);
      setLogoUploading(false);
    }
  };

  const handleBack = () => router.replace("/(tabs)/More");

  const getBrandInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 3);
  };

  const imageUrl = form.logoUrl;

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <SafeAreaView
        edges={["left", "right", "bottom"]}
        style={{ flex: 1, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.reg14, { color: subTextColor, marginTop: spacing(12) }]}>
          Loading brand settings...
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
          <Text style={[styles.reg24, { color: textColor }]}>Brand</Text>
          <Text style={[Styles.reg14, { color: subTextColor }]}>
            Manage your business details
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

            {/* ── Logo ── */}
            <View style={styles.logoSection}>
              <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>
                Brand Logo
              </Text>
              <View style={styles.logoRow}>
                <View style={styles.logoDisplayWrapper}>
                  {imageUrl ? (
                    <Image
                      source={{ uri: getImageUri(imageUrl) }}
                      style={[styles.logoImage, { borderColor: imageBorder }]}
                    />
                  ) : (
                    <View style={[styles.logoPlaceholder, { borderColor: imageBorder }]}>
                      <Text style={[styles.logoInitials, { color: textColor }]}>
                        {getBrandInitials(form.businessName)}
                      </Text>
                    </View>
                  )}
                  {logoUploading && (
                    <View style={styles.logoOverlay}>
                      <ActivityIndicator size="small" color="white" />
                    </View>
                  )}
                  <HapticTab
                    hitSlop={20}
                    style={styles.pickIcon}
                    onPress={pickImage}
                    disabled={logoUploading}
                  >
                    <Pencil size={scale(14)} color="white" />
                  </HapticTab>
                </View>
              </View>
            </View>

            {/* ── Business info ── */}
            <View style={styles.inputs}>
              <Field
                label="Brand Name"
                value={form.businessName}
                onChangeText={(t) => handleChange("businessName", t)}
                placeholder="M&S Design"
                error={error.businessName}
                labelColor={labelColor}
                inputBg={inputBg}
                inputBorder={inputBorder}
                inputTextColor={inputTextColor}
                placeholderColor={placeholderColor}
              />

              <Field
                label="Business Address"
                value={form.businessAddress}
                onChangeText={(t) => handleChange("businessAddress", t)}
                placeholder="12 Fashion Street, Victoria Island, Lagos"
                error={error.businessAddress}
                multiline
                numberOfLines={3}
                labelColor={labelColor}
                inputBg={inputBg}
                inputBorder={inputBorder}
                inputTextColor={inputTextColor}
                placeholderColor={placeholderColor}
              />

              <Field
                label="Phone Number"
                value={form.businessPhone}
                onChangeText={(t) => handleChange("businessPhone", t)}
                placeholder="+234 803 456 7890"
                error={error.businessPhone}
                keyboardType="phone-pad"
                labelColor={labelColor}
                inputBg={inputBg}
                inputBorder={inputBorder}
                inputTextColor={inputTextColor}
                placeholderColor={placeholderColor}
              />

              <Field
                label="Email"
                value={form.businessEmail}
                onChangeText={(t) => handleChange("businessEmail", t)}
                placeholder="hello@mybrand.com"
                error={error.businessEmail}
                keyboardType="email-address"
                labelColor={labelColor}
                inputBg={inputBg}
                inputBorder={inputBorder}
                inputTextColor={inputTextColor}
                placeholderColor={placeholderColor}
              />

              <Field
                label="Website"
                value={form.businessWebsite}
                onChangeText={(t) => handleChange("businessWebsite", t)}
                placeholder="www.mybrand.com"
                error={error.businessWebsite}
                keyboardType="url"
                labelColor={labelColor}
                inputBg={inputBg}
                inputBorder={inputBorder}
                inputTextColor={inputTextColor}
                placeholderColor={placeholderColor}
              />

              <Field
                label="Instagram Handle"
                value={form.instagramHandle}
                onChangeText={(t) => handleChange("instagramHandle", t)}
                placeholder="@mybrand"
                labelColor={labelColor}
                inputBg={inputBg}
                inputBorder={inputBorder}
                inputTextColor={inputTextColor}
                placeholderColor={placeholderColor}
              />
            </View>

            {/* ── Brand Colors ── */}
            <View style={[styles.section, { borderTopColor: dividerColor }]}>
              <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>
                Brand Colors
              </Text>
              <View style={styles.inputs}>
                <ColorField
                  label="Primary Color"
                  value={form.primaryColor ?? "#000000"}
                  onChangeText={(t) => handleChange("primaryColor", t)}
                  labelColor={labelColor}
                  inputBg={inputBg}
                  inputBorder={inputBorder}
                  inputTextColor={inputTextColor}
                  placeholderColor={placeholderColor}
                />
                <ColorField
                  label="Secondary Color"
                  value={form.secondaryColor ?? "#666666"}
                  onChangeText={(t) => handleChange("secondaryColor", t)}
                  labelColor={labelColor}
                  inputBg={inputBg}
                  inputBorder={inputBorder}
                  inputTextColor={inputTextColor}
                  placeholderColor={placeholderColor}
                />
              </View>
            </View>

            {/* ── Invoice settings ── */}
            <View style={[styles.section, { borderTopColor: dividerColor }]}>
              <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>
                Invoice Settings
              </Text>
              <View style={styles.inputs}>
                <Field
                  label="Invoice Footer Text"
                  value={form.footerText}
                  onChangeText={(t) => handleChange("footerText", t)}
                  placeholder="Thank you for your business! Payment terms: Net 30 days."
                  multiline
                  numberOfLines={3}
                  labelColor={labelColor}
                  inputBg={inputBg}
                  inputBorder={inputBorder}
                  inputTextColor={inputTextColor}
                  placeholderColor={placeholderColor}
                />
                <Field
                  label="Terms & Conditions"
                  value={form.termsAndConditions}
                  onChangeText={(t) => handleChange("termsAndConditions", t)}
                  placeholder="A minimum of 60% is required before sewing commences"
                  multiline
                  numberOfLines={4}
                  labelColor={labelColor}
                  inputBg={inputBg}
                  inputBorder={inputBorder}
                  inputTextColor={inputTextColor}
                  placeholderColor={placeholderColor}
                />
              </View>
            </View>

            {/* ── Bank Details ── */}
            <View style={[styles.section, { borderTopColor: dividerColor }]}>
              <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>
                Bank Details
              </Text>
              <View style={styles.inputs}>
                <Field
                  label="Bank Name"
                  value={form.bankName}
                  onChangeText={(t) => handleChange("bankName", t)}
                  placeholder="GTBank"
                  labelColor={labelColor}
                  inputBg={inputBg}
                  inputBorder={inputBorder}
                  inputTextColor={inputTextColor}
                  placeholderColor={placeholderColor}
                />
                <Field
                  label="Account Number"
                  value={form.accountNumber}
                  onChangeText={(t) => handleChange("accountNumber", t)}
                  placeholder="0123456789"
                  keyboardType="number-pad"
                  labelColor={labelColor}
                  inputBg={inputBg}
                  inputBorder={inputBorder}
                  inputTextColor={inputTextColor}
                  placeholderColor={placeholderColor}
                />
                <Field
                  label="Account Name"
                  value={form.accountName}
                  onChangeText={(t) => handleChange("accountName", t)}
                  placeholder="M&S Design"
                  labelColor={labelColor}
                  inputBg={inputBg}
                  inputBorder={inputBorder}
                  inputTextColor={inputTextColor}
                  placeholderColor={placeholderColor}
                />
              </View>
            </View>

            <View style={styles.button}>
              <PrimaryButton
                title="Save Changes"
                onPress={handleSave}
                loading={saving || logoUploading}
                props={{ disabled: saving || logoUploading }}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BrandDetailsScreen;

// ─── Shared field sub-components ─────────────────────────────────────────────
type FieldProps = {
  label: string;
  value?: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: any;
  labelColor: string;
  inputBg: string;
  inputBorder: string;
  inputTextColor: string;
  placeholderColor: string;
};

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline,
  numberOfLines = 1,
  keyboardType = "default",
  labelColor,
  inputBg,
  inputBorder,
  inputTextColor,
  placeholderColor,
}: FieldProps) => (
  <View style={Styles.inputContainer}>
    <Text style={[Styles.label, { color: labelColor }]}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderColor}
      keyboardType={keyboardType}
      returnKeyType={multiline ? "default" : "next"}
      autoCorrect={false}
      multiline={multiline}
      numberOfLines={multiline ? numberOfLines : undefined}
      style={[
        Styles.input,
        {
          paddingVertical: multiline ? spacing(10) : 0,
          paddingTop: multiline ? spacing(10) : undefined,
          minHeight: multiline ? numberOfLines * 28 : undefined,
          textAlignVertical: multiline ? "top" : "center",
          backgroundColor: inputBg,
          borderColor: inputBorder,
          paddingHorizontal: spacing(16),
          color: inputTextColor,
        },
      ]}
    />
    {error ? (
      <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error}</Text>
    ) : null}
  </View>
);

type ColorFieldProps = Omit<FieldProps, "multiline" | "numberOfLines"> & {
  value: string;
};

const ColorField = ({ label, value, onChangeText, labelColor, inputBg, inputBorder, inputTextColor, placeholderColor }: ColorFieldProps) => (
  <View style={Styles.inputContainer}>
    <Text style={[Styles.label, { color: labelColor }]}>{label}</Text>
    <View style={[Styles.inputRow ?? {}, { flexDirection: "row", alignItems: "center", gap: spacing(8) }]}>
      {/* Color swatch */}
      <View
        style={[
          styles.colorSwatch,
          {
            backgroundColor: /^#[0-9A-Fa-f]{3,6}$/.test(value) ? value : "#000000",
            borderColor: inputBorder,
          },
        ]}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="#000000"
        placeholderTextColor={placeholderColor}
        autoCorrect={false}
        autoCapitalize="characters"
        maxLength={7}
        style={[
          Styles.input,
          {
            flex: 1,
            paddingVertical: 0,
            backgroundColor: inputBg,
            borderColor: inputBorder,
            paddingHorizontal: spacing(16),
            color: inputTextColor,
          },
        ]}
      />
    </View>
  </View>
);

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
  reg14: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    gap: spacing(28),
  },
  logoSection: {
    gap: spacing(10),
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoDisplayWrapper: {
    position: "relative",
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
    borderWidth: 0.2,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 14,
    borderWidth: 0.2,
    backgroundColor: "rgba(22,152,141,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoInitials: {
    fontFamily: "regular",
    fontSize: scaleFontSize(22),
  },
  logoOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: spacing(7),
    borderRadius: 10,
  },
  sectionLabel: {
    fontFamily: "medium",
    fontSize: scaleFontSize(13),
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  section: {
    gap: spacing(12),
    paddingTop: spacing(20),
    borderTopWidth: 1,
  },
  inputs: {
    gap: spacing(16),
  },
  colorSwatch: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  button: {},
});
