import PrimaryButton from "@/src/components/button/PrimaryButton";
import { HapticTab } from "@/src/components/haptic-tab";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { getCurrentUserEmail } from "@/src/lib/auth-utils";
import { useClientStore } from "@/src/stores/clientSlice";
import { Client } from "@/src/types/client";
import { FormatDateToYYYYMMDD, scale, scaleFontSize, spacing } from "@/src/utils/random";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "lucide-react-native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CreateClientScreen = () => {
  const saveClient = useClientStore((state) => state.saveClient);
  const loading = useClientStore((state) => state.loading);

  const { isDark } = useTheme();
  const { top } = useSafeAreaInsets();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const labelColor = isDark ? "rgba(160,160,160,1)" : Colors.label;
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "white";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : Colors.inputBorder;
  const inputTextColor = isDark ? Colors.text.white : Colors.black;
  const placeholderColor = isDark ? "rgba(100,100,100,1)" : Colors.grayText;
  const dividerColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(229,231,235,1)";

  const [clientData, setClientData] = useState<Client>({
    id: "",
    name: "",
    phone: "",
    email: "",
    lastVisit: "",
    tailorId: getCurrentUserEmail(),
    userEmail: getCurrentUserEmail(),
    createdAt: "",
    notes: "",
  });

  const [error, setError] = useState({ name: "", phone: "", email: "" });

  const handleDataChange = (field: keyof typeof clientData, value: string) => {
    setClientData({ ...clientData, [field]: value });
    if (error[field as keyof typeof error]) {
      setError((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = { name: "", email: "", phone: "" };
    let isValid = true;

    if (!clientData.name.trim()) {
      newErrors.name = "Client name is required";
      isValid = false;
    }
    if (!clientData.email.trim()) {
      newErrors.email = "Email address is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientData.email)) {
      newErrors.email = "Enter a valid email address";
      isValid = false;
    }
    if (!clientData.phone.trim() || clientData.phone.length < 11) {
      newErrors.phone = "Enter a valid 11-digit phone number";
      isValid = false;
    }

    setError(newErrors);
    return isValid;
  };

  const handleSaveClient = async () => {
    if (!validateForm()) return;
    try {
      await saveClient({
        ...clientData,
        // backend generates its own id; we pass phone as a candidate
        // so existing data keyed by phone stays consistent
        id: clientData.phone,
        createdAt: new Date().toISOString(),
        lastVisit: FormatDateToYYYYMMDD(new Date().toISOString()),
      });
      handleBack();
    } catch (e) {
      console.error("Error saving client", e);
    }
  };

  const handleBack = () => router.replace("/(tabs)/Clients");

  const inputStyle = [
    Styles.input,
    {
      paddingVertical: 0,
      paddingHorizontal: spacing(16),
      backgroundColor: inputBg,
      borderColor: inputBorder,
      color: inputTextColor,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: top }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={styles.header}>
        <HapticTab style={styles.backBtn} onPress={handleBack}>
          <ChevronLeft
            size={scale(20)}
            color={isDark ? "rgba(200,200,200,1)" : "rgba(54,65,83,1)"}
            strokeWidth={1.5}
          />
        </HapticTab>
        <Text style={[styles.title, { color: textColor }]}>Add New Client</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: dividerColor }]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? spacing(50) : spacing(0)}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="interactive"
        >
          {/* Name */}
          <View style={Styles.inputContainer}>
            <Text style={[Styles.label, { color: labelColor }]}>
              Name <Text style={styles.red}>*</Text>
            </Text>
            <TextInput
              value={clientData.name}
              onChangeText={(t) => handleDataChange("name", t)}
              placeholder="Enter client's full name"
              placeholderTextColor={placeholderColor}
              returnKeyType="next"
              keyboardType="default"
              autoCorrect={false}
              style={inputStyle}
            />
            {error.name ? <Text style={styles.errorText}>{error.name}</Text> : null}
          </View>

          {/* Email */}
          <View style={Styles.inputContainer}>
            <Text style={[Styles.label, { color: labelColor }]}>
              Email Address <Text style={styles.red}>*</Text>
            </Text>
            <TextInput
              value={clientData.email}
              onChangeText={(t) => handleDataChange("email", t)}
              placeholder="client@email.com"
              placeholderTextColor={placeholderColor}
              returnKeyType="next"
              keyboardType="email-address"
              autoCorrect={false}
              autoCapitalize="none"
              style={inputStyle}
            />
            {error.email ? <Text style={styles.errorText}>{error.email}</Text> : null}
          </View>

          {/* Phone */}
          <View style={Styles.inputContainer}>
            <Text style={[Styles.label, { color: labelColor }]}>
              Phone Number <Text style={styles.red}>*</Text>
            </Text>
            <TextInput
              value={clientData.phone}
              onChangeText={(t) => handleDataChange("phone", t)}
              placeholder="08012345678"
              placeholderTextColor={placeholderColor}
              returnKeyType="done"
              keyboardType="number-pad"
              maxLength={11}
              style={inputStyle}
            />
            {error.phone ? <Text style={styles.errorText}>{error.phone}</Text> : null}
          </View>

          {/* Notes */}
          <View style={Styles.inputContainer}>
            <Text style={[Styles.label, { color: labelColor }]}>Notes</Text>
            <TextInput
              value={clientData.notes}
              onChangeText={(t) => handleDataChange("notes", t)}
              placeholder="Add notes about this client (preferences, special requirements, etc.)"
              placeholderTextColor={placeholderColor}
              multiline
              textAlignVertical="top"
              style={[
                Styles.input,
                {
                  height: 100,
                  paddingTop: spacing(14),
                  paddingHorizontal: spacing(16),
                  backgroundColor: inputBg,
                  borderColor: inputBorder,
                  color: inputTextColor,
                },
              ]}
            />
          </View>

          <View style={styles.btnWrapper}>
            <PrimaryButton title="Save Client" onPress={handleSaveClient} loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default CreateClientScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(8),
    paddingHorizontal: spacing(16),
    paddingTop: spacing(12),
    paddingBottom: spacing(14),
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: "medium",
    fontSize: scaleFontSize(20),
    lineHeight: 28,
  },
  divider: {
    height: 1,
    marginHorizontal: spacing(16),
    marginBottom: spacing(4),
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing(16),
    paddingTop: spacing(20),
    paddingBottom: spacing(40),
    gap: spacing(16),
  },
  red: {
    color: "rgba(251,44,54,1)",
  },
  errorText: {
    fontFamily: "regular",
    fontSize: scaleFontSize(12),
    color: "rgba(251,44,54,1)",
    marginTop: spacing(3),
  },
  btnWrapper: {
    marginTop: spacing(8),
  },
});
