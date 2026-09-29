/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";
const PRIMARY_COLOR = "rgba(22, 152, 141, 1)";
const SECONDARY_COLOR = "rgba(142, 208, 108, 1)";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
  primary: PRIMARY_COLOR,
  primary20: "rgba(8, 94, 94, 0.2)",
  primaryDark: "#0D6B62",
  tintTabColor: "rgba(8, 94, 94, 1)",
  secondary: SECONDARY_COLOR,
  plight: "rgba(232, 245, 244, 1)",
  black: "rgba(0, 0, 0, 1)",
  black80: "rgba(0, 0, 0, 0.8)",
  black50: "rgba(0, 0, 0, 0.5)",
  black20: "rgba(0, 0, 0, 0.2)",
  black10: "rgba(0, 0, 0, 0.1)",
  label: "rgba(108, 114, 120, 1)",
  inputBorder: "rgba(237, 241, 243, 1)",
  grayText: "rgba(139, 144, 154, 1)",
  iconGrey: "rgba(172, 181, 187, 1)",
  grey: "rgba(106, 114, 130, 1)",
  text: {
    white: "rgba(238, 238, 238, 1)",
    gray: "rgba(108, 114, 120, 1)",
    black: "rgba(17, 24, 39, 1)",
  },
};

export const THEME_COLORS = [
  { label: "Teal", value: "#16988D" }, // your PRIMARY_COLOR
  { label: "Green", value: "#8ED06C" }, // your SECONDARY_COLOR
  { label: "Navy", value: "#1E3A5F" },
  { label: "Slate", value: "#475569" },
  { label: "Rose", value: "#E11D48" },
  { label: "Amber", value: "#D97706" },
  { label: "Indigo", value: "#4338CA" },
  { label: "Charcoal", value: "#374151" },
];

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
