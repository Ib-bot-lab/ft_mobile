import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
// import * as Clipboard from "expo-clipboard";
import React, { useEffect, useRef } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const H_PADDING = 32;
const GAP = 10;
const SEPARATOR_WIDTH = 16;
const BOX_WIDTH =
  (SCREEN_WIDTH - H_PADDING * 2 - GAP * 5 - SEPARATOR_WIDTH) / 6;
const BOX_SIZE = Math.min(Math.max(BOX_WIDTH, 40), 56);

type Props = {
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
};

const OTPInput: React.FC<Props> = ({
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
}) => {
  const inputRef = useRef<TextInput>(null);
  const { isDark } = useTheme();

  const boxBg = isDark ? "rgba(30,30,30,1)" : "white";
  const digitColor = isDark ? Colors.text.white : Colors.black;
  const borderActive = isDark ? Colors.text.white : Colors.black;
  const borderInactive = isDark ? "rgba(80,80,80,1)" : Colors.black50;
  const separatorColor = isDark ? "rgba(80,80,80,1)" : Colors.black50;

  useEffect(() => {
    if (value.length === 6 && onComplete) {
      onComplete(value);
    }
  }, [value, onComplete]);

  // useEffect(() => {
  //   const checkClipboard = async () => {
  //     try {
  //       const clip = await Clipboard.getStringAsync();
  //       if (/^\d{6}$/.test(clip)) {
  //         onChange(clip);
  //       }
  //     } catch (error) {}
  //   };

  //   if (autoFocus) {
  //     const timer = setTimeout(checkClipboard, 100);
  //     return () => clearTimeout(timer);
  //   }
  // }, [autoFocus]);

  const handlePress = () => {
    if (!disabled) inputRef.current?.focus();
  };

  const handleChange = (text: string) => {
    const numeric = text.replace(/\D/g, "").slice(0, 6);
    onChange(numeric);
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {/* Hidden main input */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus={autoFocus}
        editable={!disabled}
        caretHidden
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        style={styles.hiddenInput}
      />

      <View style={styles.row}>
        {Array.from({ length: 6 }).map((_, idx) => {
          const digit = value[idx] ?? "";
          const showSeparator = idx === 2;

          return (
            <React.Fragment key={idx}>
              <View
                style={[
                  styles.box,
                  {
                    width: BOX_SIZE,
                    height: BOX_SIZE,
                    backgroundColor: boxBg,
                    borderColor: digit ? borderActive : borderInactive,
                  },
                ]}
              >
                <Text style={[styles.digit, { color: digitColor }]}>{digit}</Text>
              </View>

              {showSeparator && (
                <View style={styles.separator}>
                  <View style={[styles.separatorLine, { backgroundColor: separatorColor }]} />
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>
    </Pressable>
  );
};

export default OTPInput;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: H_PADDING,
  },
  hiddenInput: {
    opacity: 0,
    height: 0,
    width: 0,
    position: "absolute",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: GAP,
  },
  box: {
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
  separator: {
    width: SEPARATOR_WIDTH,
    justifyContent: "center",
    alignItems: "center",
  },
  separatorLine: {
    width: 8,
    height: 2,
    backgroundColor: Colors.black50,
    borderRadius: 1,
  },
  digit: {
    fontSize: 22,
    fontWeight: "600",
  },
});
