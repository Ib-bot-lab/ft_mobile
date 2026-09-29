import PrimaryButton from "@/src/components/button/PrimaryButton";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/hooks/auth";
import { spacing } from "@/src/utils/random";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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

const ForgetPasswordScreen = () => {
  const { top: statusBarHeight } = useSafeAreaInsets();
  const { loading, sendResetEmail } = useAuth();
  const { isDark } = useTheme();

  const bg = isDark ? "#151718" : "white";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const labelColor = isDark ? "rgba(180,180,180,1)" : Colors.label;
  const inputBg = isDark ? "rgba(30,30,30,1)" : "white";
  const inputBorder = isDark ? "rgba(60,60,60,1)" : Colors.inputBorder;
  const placeholderColor = isDark ? "rgba(100,100,100,1)" : Colors.grayText;

  const [email, setEmail] = useState("");
  const [error, setError] = useState({ email: "" });

  const handleEmailChange = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmail(text);
    if (!text) {
      setError((prev) => ({ ...prev, email: "Email is required" }));
    } else if (!emailRegex.test(text)) {
      setError((prev) => ({ ...prev, email: "Email address is invalid" }));
    } else {
      setError((prev) => ({ ...prev, email: "" }));
    }
  };

  const validateForm = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email?.trim()) {
      setError({ email: "Email is required" });
      return false;
    } else if (!emailRegex.test(email.trim())) {
      setError({ email: "Please enter a valid email address" });
      return false;
    }
    setError({ email: "" });
    return true;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;
    try {
      await sendResetEmail(email);
      router.replace("/sign-in");
    } catch (err) {
      console.error("error in send email", err);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.primary }}>
      <ImageBackground
        source={require("@/assets/images/screen_bg.png")}
        style={[styles.headerBg, { paddingTop: statusBarHeight + spacing(20) }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.col}>
            <Text style={Styles.bold32}>Recreate Your Password</Text>
            <Text style={Styles.reg14}>
              A reset link will be sent to your email.
            </Text>
          </View>

          <Text style={Styles.bold12}>
            Remember your password?{"  "}
            <Text
              style={[
                Styles.med16,
                { color: Colors.secondary, textDecorationLine: "underline" },
              ]}
              onPress={() => router.replace("/sign-in")}
            >
              Sign in
            </Text>
          </Text>
        </View>
      </ImageBackground>

      <KeyboardAvoidingView
        style={{
          flex: 1,
          backgroundColor: bg,
          marginTop: -30,
          borderTopRightRadius: 30,
          borderTopLeftRadius: 30,
        }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={
          Platform.OS === "ios" ? spacing(50) : spacing(0)
        }
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing(30) }}
          keyboardDismissMode="interactive"
        >
          <View style={styles.content}>
            <View style={styles.inputsWrapper}>
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="Email"
                  placeholderTextColor={placeholderColor}
                  textContentType="emailAddress"
                  returnKeyType="done"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    Styles.input,
                    {
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
                      color: textColor,
                    },
                  ]}
                />
                {error.email ? (
                  <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>
                    {error.email}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.footer}>
              <PrimaryButton
                title="Send Email"
                onPress={handleContinue}
                loading={loading}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ForgetPasswordScreen;

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
    gap: spacing(24),
    paddingTop: spacing(50),
  },
  footer: {
    gap: spacing(32),
  },
});
