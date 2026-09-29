import PrimaryButton from "@/src/components/button/PrimaryButton";
import { HapticTab } from "@/src/components/haptic-tab";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/hooks/auth";
import { useAuthStore } from "@/src/stores/authSlice";
import { scale, spacing } from "@/src/utils/random";
import { router } from "expo-router";
import { Eye, EyeOff, MoveLeft } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
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

const CreatePasswordScreen = () => {
  const { top: statusBarHeight } = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { loading, signUp } = useAuth();
  const userData = useAuthStore((state) => state.userData);

  const bg = isDark ? "#151718" : "white";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const labelColor = isDark ? "rgba(180,180,180,1)" : Colors.label;
  const inputBg = isDark ? "rgba(30,30,30,1)" : "white";
  const inputBorder = isDark ? "rgba(60,60,60,1)" : Colors.inputBorder;
  const placeholderColor = isDark ? "rgba(100,100,100,1)" : Colors.grayText;

  const [isSecure, setIsSecure] = useState(true);
  const [details, setDetails] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState({ password: "", confirmPassword: "" });

  const handleDataChange = (field: keyof typeof details, value: string) => {
    setDetails((prev) => ({ ...prev, [field]: value }));
    if (error[field]) setError((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors = { password: "", confirmPassword: "" };
    let isValid = true;
    if (!details.password?.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (details.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }
    if (!details.confirmPassword?.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (details.password !== details.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }
    setError(newErrors);
    return isValid;
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix the errors in the form before continuing.", [{ text: "OK" }]);
      return;
    }
    try {
      const success = await signUp(userData, details.password);
      if (success) router.replace("/(tabs)/Dashboard");
    } catch (err) {
      console.error("error", err);
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
            <HapticTab onPress={() => router.back()} hitSlop={20} style={{ paddingVertical: spacing(8) }}>
              <MoveLeft size={scale(20)} color={"white"} />
            </HapticTab>
            <Text style={[Styles.sm15, { color: Colors.secondary }]}>Step 4 Of 4</Text>
            <View style={styles.col}>
              <Text style={Styles.bold32}>One Platform.{"\n"}Powering Business Growth</Text>
              <Text style={Styles.reg14}>Almost done. Just one more thing..</Text>
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
                <Text style={[Styles.label, { color: labelColor }]}>Password</Text>
                <View style={[Styles.input2, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <TextInput
                    value={details.password}
                    onChangeText={(v) => handleDataChange("password", v)}
                    placeholder="*****"
                    secureTextEntry={isSecure}
                    textContentType="password"
                    placeholderTextColor={placeholderColor}
                    returnKeyType="next"
                    autoCorrect={false}
                    style={{ flex: 1, ...Styles.inputFontPadding, color: textColor }}
                  />
                  <TouchableOpacity onPress={() => setIsSecure(!isSecure)} hitSlop={20}>
                    {isSecure ? (
                      <EyeOff size={scale(15)} color={Colors.iconGrey} />
                    ) : (
                      <Eye size={scale(15)} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                </View>
                {error.password ? <Text style={Styles.errorText}>{error.password}</Text> : null}
              </View>

              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Confirm Password</Text>
                <View style={[Styles.input2, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <TextInput
                    value={details.confirmPassword}
                    onChangeText={(v) => handleDataChange("confirmPassword", v)}
                    placeholder="*****"
                    secureTextEntry={isSecure}
                    placeholderTextColor={placeholderColor}
                    textContentType="password"
                    returnKeyType="done"
                    autoCorrect={false}
                    style={{ flex: 1, ...Styles.inputFontPadding, color: textColor }}
                  />
                  <TouchableOpacity onPress={() => setIsSecure(!isSecure)} hitSlop={20}>
                    {isSecure ? (
                      <EyeOff size={scale(15)} color={Colors.iconGrey} />
                    ) : (
                      <Eye size={scale(15)} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                </View>
                {error.confirmPassword ? <Text style={Styles.errorText}>{error.confirmPassword}</Text> : null}
              </View>
            </View>

            <View style={styles.footer}>
              <PrimaryButton title="Launch Account" onPress={handleContinue} loading={loading} />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreatePasswordScreen;

const styles = StyleSheet.create({
  headerBg: {
    backgroundColor: Colors.primary,
    padding: spacing(16),
    paddingBottom: spacing(50),
  },
  headerContent: { gap: spacing(12) },
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
  footer: { gap: spacing(32) },
});
