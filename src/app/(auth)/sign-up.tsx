import PrimaryButton from "@/src/components/button/PrimaryButton";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { API_BASE_URL } from "@/src/lib/apiClient";
import { useAuthStore } from "@/src/stores/authSlice";
import { ShowToastMessage, spacing } from "@/src/utils/random";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SignUpScreen = () => {
  const { top: statusBarHeight } = useSafeAreaInsets();
  const { isDark } = useTheme();

  const bg = isDark ? "#151718" : "white";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const labelColor = isDark ? "rgba(180,180,180,1)" : Colors.label;
  const inputBg = isDark ? "rgba(30,30,30,1)" : "white";
  const inputBorder = isDark ? "rgba(60,60,60,1)" : Colors.inputBorder;
  const placeholderColor = isDark ? "rgba(100,100,100,1)" : Colors.grayText;

  const country = { dialCode: "+234" };

  const [error, setError] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const userData = useAuthStore((state) => state.userData);
  const updateUserData = useAuthStore((state) => state.updateUserData);

  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  const handleDataChange = (field: keyof typeof userData, value: string) => {
    updateUserData({ ...userData, [field]: value });
    if (error[field as keyof typeof error]) {
      setError((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors = { name: "", email: "", phone: "" };
    let isValid = true;

    if (!userData.name?.trim() && userData.name.length < 5) {
      newErrors.name = "First name is required";
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userData.email?.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(userData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!userData.phone?.trim()) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    } else {
      const cleanedPhone = userData.phone.replace(/\D/g, "");
      if (cleanedPhone.length !== 10) {
        newErrors.phone = "Phone number must be exactly 10 digits";
        isValid = false;
      }
    }

    setError(newErrors);
    return isValid;
  };

  const focusFirstErrorField = () => {
    setTimeout(() => {
      if (error.name) nameRef.current?.focus();
      else if (error.email) emailRef.current?.focus();
      else if (error.phone) phoneRef.current?.focus();
    }, 100);
  };

  const handleContinue = async () => {
    setLoading(true);
    if (!validateForm()) {
      focusFirstErrorField();
      Alert.alert("Validation Error", "Please fix the errors in the form before continuing.", [{ text: "OK" }]);
      setLoading(false);
      return;
    }
    try {
      const res  = await fetch(`${API_BASE_URL}/auth/send-email-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: userData.email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        ShowToastMessage({ title: data.message || "Failed to send OTP", from: "top", preset: "error" });
        return;
      }
      router.push({ pathname: "/(auth)/verify-otp/[otp]", params: { otp: data.otp } });
      ShowToastMessage({ title: "OTP sent to your email", from: "top", preset: "done" });
    } catch (err) {
      console.error("error sending email OTP", err);
      ShowToastMessage({ title: "Network error. Please try again.", from: "top", preset: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
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
            <Text style={[Styles.sm15, { color: Colors.secondary }]}>
              Step 1 Of 4
            </Text>
            <View style={styles.col}>
              <Text style={Styles.bold32}>Welcome Back To Business</Text>
              <Text style={Styles.reg14}>
                Set up your Fashion Tally account today!
              </Text>
            </View>
            <Text style={Styles.bold12}>
              Already have an account?{"  "}
              <Text
                style={[Styles.med16, { color: Colors.secondary, textDecorationLine: "underline" }]}
                onPress={() => router.replace("/sign-in")}
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
                <Text style={[Styles.label, { color: labelColor }]}>Name</Text>
                <TextInput
                  ref={nameRef}
                  value={userData.name}
                  onChangeText={(text) => handleDataChange("name", text)}
                  placeholder="Name"
                  placeholderTextColor={placeholderColor}
                  textContentType="name"
                  returnKeyType="next"
                  keyboardType="default"
                  autoCorrect={false}
                  style={[Styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                />
                {error.name ? (
                  <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.name}</Text>
                ) : null}
              </View>

              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Email</Text>
                <TextInput
                  ref={emailRef}
                  value={userData.email}
                  onChangeText={(text) => handleDataChange("email", text)}
                  placeholder="Email"
                  placeholderTextColor={placeholderColor}
                  textContentType="emailAddress"
                  returnKeyType="next"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[Styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                />
                {error.email ? (
                  <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.email}</Text>
                ) : null}
              </View>

              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Phone Number</Text>
                <View style={[Styles.input2, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <View style={Styles.pickerBtn}>
                    <Text style={[Styles.countryFlag, { color: textColor }]}>{country.dialCode}</Text>
                  </View>
                  <TextInput
                    ref={phoneRef}
                    value={userData.phone}
                    onChangeText={(value) => {
                      let rawPhone = value;
                      if (rawPhone.startsWith("0") && rawPhone.length > 5) rawPhone = rawPhone.slice(1);
                      rawPhone = rawPhone.replace(/\D/g, "");
                      handleDataChange("phone", rawPhone);
                    }}
                    placeholder="Enter your Phone number"
                    keyboardType="number-pad"
                    textContentType="telephoneNumber"
                    maxLength={10}
                    placeholderTextColor={placeholderColor}
                    style={{ ...Styles.inputFontPadding, flex: 1, color: textColor }}
                  />
                </View>
                {error.phone ? (
                  <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.phone}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.footer}>
              <PrimaryButton title="Continue" onPress={handleContinue} loading={loading} />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  headerBg: {
    backgroundColor: Colors.primary,
    padding: spacing(16),
    paddingBottom: spacing(50),
  },
  headerContent: {
    gap: spacing(12),
  },
  col: {
    gap: spacing(4),
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing(16),
    gap: spacing(32),
  },
  inputsWrapper: {
    gap: spacing(16),
    paddingTop: spacing(50),
  },
  footer: {
    gap: spacing(32),
  },
});
