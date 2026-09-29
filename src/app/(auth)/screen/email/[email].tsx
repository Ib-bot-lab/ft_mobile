import PrimaryButton from "@/src/components/button/PrimaryButton";
import { HapticTab } from "@/src/components/haptic-tab";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useAuth } from "@/src/hooks/auth";
import {
  scale,
  scaleFontSize,
  scaleHeight,
  scaleWidth,
  spacing,
} from "@/src/utils/random";
import { router, useLocalSearchParams } from "expo-router";
import { MoveLeft } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const OtpVerificationScreen = () => {
  const insets = useSafeAreaInsets();

  const { email: param, password: passwordParam } = useLocalSearchParams();
  const EMAIL = param.toString();
  const PASSWORD = passwordParam.toString();

  const otpRefs = useRef<(TextInput | null)[]>([]);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const { loading, confrimResetCode, sendResetEmail } = useAuth();

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pastedDigits = value.replace(/\D/g, "").split("").slice(0, 6);

      const updatedOtp = [...otp];
      pastedDigits.forEach((digit, idx) => {
        if (index + idx < 6) {
          updatedOtp[index + idx] = digit;
        }
      });

      setOtp(updatedOtp);

      const focusIndex = Math.min(index + pastedDigits.length - 1, 5);
      if (focusIndex < 6) otpRefs.current[focusIndex]?.focus();
    } else if (/^\d$/.test(value) || value === "") {
      const updatedOtp = [...otp];
      updatedOtp[index] = value;
      setOtp(updatedOtp);

      if (value && index < 5) otpRefs.current[index + 1]?.focus();
      if (!value && index > 0) otpRefs.current[index - 1]?.focus();
    }
  };

  const [time, setTime] = useState(30);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (time > 0) {
      const timer = setTimeout(() => setTime(time - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [time]);

  const handleContinue = async () => {
    const isComplete = otp.every((digit) => digit !== "");
    if (!isComplete) return;
    try {
      await confrimResetCode(otp.join(""), PASSWORD);
    } catch (error) {
      console.error("error in otp", error);
    }
  };

  const resendOtp = async () => {
    try {
      await sendResetEmail(EMAIL);
    } catch (error) {
      console.error("error resending otp", error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom", "left", "right"]}>
      <View style={styles.container}>
        <ImageBackground
          source={require("@/assets/images/screen_bg.png")}
          style={[styles.headerBg, { paddingTop: insets.top + spacing(20) }]}
        >
          <View style={styles.headerContent}>
            <HapticTab
              onPress={() => router.back()}
              hitSlop={20}
              style={{ paddingVertical: spacing(8) }}
            >
              <MoveLeft size={scale(20)} color={"white"} />
            </HapticTab>
            <View style={[styles.col, {}]}>
              <Text style={[Styles.bold32]}>Enter Code.</Text>
              <Text style={[Styles.reg14]}>
                We just sent a 6-digit activation code to {EMAIL}.
              </Text>
            </View>

            <Text style={[Styles.bold12]}>
              Already have an account?{"  "}
              <Text
                style={[
                  Styles.med16,
                  {
                    color: Colors.secondary,
                    textDecorationLine: "underline",
                  },
                ]}
                onPress={() => router.push("/sign-in")}
              >
                Sign in
              </Text>
            </Text>
          </View>
        </ImageBackground>
        <KeyboardAvoidingView
          style={{
            flex: 1,
            backgroundColor: "white",
          }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={
            Platform.OS === "ios" ? spacing(50) : spacing(0)
          }
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{
              flexGrow: 1,
            }}
            keyboardDismissMode="interactive"
          >
            <View style={styles.content}>
              {/* otps */}
              <View style={styles.otpContainer}>
                <View style={styles.row}>
                  {otp.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      ref={(ref) => {
                        otpRefs.current[idx] = ref;
                      }}
                      value={digit}
                      onChangeText={(val) => handleOtpChange(idx, val)}
                      keyboardType="numeric"
                      maxLength={6}
                      style={[
                        styles.otpInput,
                        focusedIndex === idx && {
                          borderColor: "black",
                          borderWidth: 2,
                        },
                      ]}
                      onFocus={() => setFocusedIndex(idx)}
                      onBlur={() => setFocusedIndex(null)}
                    />
                  ))}
                </View>

                <View
                  style={{
                    paddingTop: spacing(10),
                  }}
                >
                  {time > 0 && time < 30 && (
                    <Text style={styles.textBtn}>
                      Resend code in{" "}
                      <Text style={{ color: Colors.secondary }}>
                        {time} Seconds
                      </Text>
                    </Text>
                  )}

                  {time < 1 && (
                    <TouchableOpacity hitSlop={20} onPress={resendOtp}>
                      <Text style={styles.textBtn}>Resend Code?</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={[styles.footer]}>
                <PrimaryButton
                  title="Confirm"
                  onPress={handleContinue}
                  props={{ disabled: loading }}
                  loading={loading}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

export default OtpVerificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingHorizontal: spacing(16),
    backgroundColor: "white",
  },
  headerBg: {
    width: "100%",
    height: "auto",
    backgroundColor: Colors.primary,
    padding: spacing(16),
    paddingBottom: spacing(50),
  },
  headerContent: {
    gap: spacing(8),
  },
  col: {
    gap: spacing(4),
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing(16),
    gap: spacing(32),
  },
  otpContainer: {
    paddingVertical: spacing(35),
    justifyContent: "center",
    alignItems: "center",
    gap: spacing(30),
  },
  otpInput: {
    width: scaleWidth(width / 6 - 20),
    height: scaleHeight(70),
    textAlign: "center",
    borderWidth: 1,
    borderRadius: 15,
    fontSize: scaleFontSize(20),
    borderColor: "#ccc",
  },
  otpHeader: {
    paddingVertical: spacing(30),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textBtn: {
    fontFamily: "regular",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing(10),
  },
  footer: {
    flex: 1,
    justifyContent: "flex-end",
  },
});
