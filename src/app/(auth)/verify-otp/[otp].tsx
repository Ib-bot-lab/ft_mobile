import OTPInput from "@/src/components/shared/auth/OTPInput";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing } from "@/src/utils/random";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const VerifyOtpScreen = () => {
  const { top: statusBarHeight } = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { otp: paramOtp } = useLocalSearchParams();

  const bg = isDark ? "#151718" : "white";

  const generatedOtp = paramOtp.toString();
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (otp.length === 6 && otp === generatedOtp) {
      router.replace("/(auth)/screen/store-details");
    }
  }, [otp, generatedOtp]);

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
              Step 2 Of 4
            </Text>
            <View style={styles.col}>
              <Text style={Styles.bold32}>Verify Your Account</Text>
              <Text style={Styles.reg14}>
                Check your email for the OTP code
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
            <OTPInput value={otp} onChange={setOtp} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default VerifyOtpScreen;

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
    paddingVertical: spacing(50),
    alignItems: "center",
  },
});
