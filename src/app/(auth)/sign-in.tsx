import PrimaryButton from "@/src/components/button/PrimaryButton";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/hooks/auth";
import { scale, spacing } from "@/src/utils/random";
import { router } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const redirectToExternalURL = async (url: string) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", `Don't know how to open this URL: ${url}`);
    }
  } catch (error) {
    console.error("An error occurred", error);
    Alert.alert("Error", "Failed to open the link. Please try again later.");
  }
};

const SignInScreen = () => {
  const { top: statusBarHeight } = useSafeAreaInsets();
  const { signIn, loading } = useAuth();
  const { isDark } = useTheme();

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState({ email: "", password: "" });
  const [isSecure, setIsSecure] = useState(true);

  const bg = isDark ? "#151718" : "white";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const labelColor = isDark ? "rgba(180,180,180,1)" : Colors.label;
  const inputBg = isDark ? "rgba(30,30,30,1)" : "white";
  const inputBorder = isDark ? "rgba(60,60,60,1)" : Colors.inputBorder;
  const placeholderColor = isDark ? "rgba(100,100,100,1)" : Colors.grayText;

  const handleEmailChange = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setLoginData((prev) => ({ ...prev, email: text }));
    if (!text) {
      setLoginError((prev) => ({ ...prev, email: "Email is required" }));
    } else if (!emailRegex.test(text)) {
      setLoginError((prev) => ({ ...prev, email: "Email address is invalid" }));
    } else {
      setLoginError((prev) => ({ ...prev, email: "" }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setLoginData((prev) => ({ ...prev, password: text }));
    if (!text) {
      setLoginError((prev) => ({ ...prev, password: "Password is required" }));
    } else if (text.length < 6) {
      setLoginError((prev) => ({
        ...prev,
        password: "Password must be at least 8 characters long",
      }));
    } else {
      setLoginError((prev) => ({ ...prev, password: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors = { email: "", password: "" };
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!loginData.email?.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(loginData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!loginData.password?.trim() && loginData.password.length < 6) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setLoginError(newErrors);
    return isValid;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;
    try {
      const result = await signIn(loginData.email, loginData.password);
      if (result) {
        router.replace("/(tabs)/Dashboard");
      }
    } catch (error) {
      console.error("error in sign in", error);
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
            <View style={styles.col}>
              <Text style={Styles.bold32}>Welcome Back To Business</Text>
              <Text style={Styles.reg14}>
                Access your dashboard and continue where you left off
              </Text>
            </View>

            <Text style={Styles.bold12}>
              Don't have an account?{"  "}
              <Text
                style={[
                  Styles.med16,
                  { color: Colors.secondary, textDecorationLine: "underline" },
                ]}
                onPress={() => router.replace("/sign-up")}
              >
                Sign up
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
              <View style={styles.inputs}>
                <View style={Styles.inputContainer}>
                  <Text style={[Styles.label, { color: labelColor }]}>
                    Email
                  </Text>
                  <TextInput
                    value={loginData.email}
                    onChangeText={handleEmailChange}
                    placeholder="Email"
                    placeholderTextColor={placeholderColor}
                    textContentType="emailAddress"
                    returnKeyType="next"
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
                  {loginError.email ? (
                    <Text
                      style={{ ...Styles.reg12, color: "red", marginTop: 4 }}
                    >
                      {loginError.email}
                    </Text>
                  ) : null}
                </View>

                <View style={Styles.inputContainer}>
                  <Text style={[Styles.label, { color: labelColor }]}>
                    Password
                  </Text>
                  <View
                    style={[
                      Styles.input2,
                      { backgroundColor: inputBg, borderColor: inputBorder },
                    ]}
                  >
                    <TextInput
                      value={loginData.password}
                      onChangeText={handlePasswordChange}
                      placeholder="*****"
                      placeholderTextColor={placeholderColor}
                      secureTextEntry={isSecure}
                      textContentType="password"
                      returnKeyType="done"
                      autoCorrect={false}
                      autoCapitalize="none"
                      style={{
                        ...Styles.inputFontPadding,
                        flex: 1,
                        color: textColor,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setIsSecure(!isSecure)}
                      hitSlop={20}
                    >
                      {isSecure ? (
                        <EyeOff size={scale(15)} color={Colors.iconGrey} />
                      ) : (
                        <Eye size={scale(15)} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  </View>
                  {loginError.password ? (
                    <Text
                      style={{ ...Styles.reg12, color: "red", marginTop: 4 }}
                    >
                      {loginError.password}
                    </Text>
                  ) : null}
                </View>
              </View>

              <Text
                style={[Styles.med12, { textAlign: "right", color: textColor }]}
                onPress={() => router.replace("/(auth)/screen/forget-password")}
              >
                Forgot Password ?
              </Text>
            </View>

            <View style={styles.footer}>
              <PrimaryButton
                title="Log In"
                onPress={handleContinue}
                loading={loading}
              />
              <Text
                style={[Styles.med12, { textAlign: "center", color: textColor }]}
              >
                By signing up, you agree to the{" "}
                <Text
                  style={{ ...Styles.bold12, color: textColor }}
                  onPress={() =>
                    redirectToExternalURL(
                      "https://www.fashiontally.com/terms-of-service"
                    )
                  }
                >
                  Terms of Service
                </Text>{" "}
                and{" "}
                <Text
                  style={{ ...Styles.bold12, color: textColor }}
                  onPress={() =>
                    redirectToExternalURL(
                      "https://www.fashiontally.com/privacy-policy"
                    )
                  }
                >
                  Data Processing Agreement
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignInScreen;

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
  inputs: {
    gap: spacing(16),
  },
  footer: {
    gap: spacing(32),
  },
});
