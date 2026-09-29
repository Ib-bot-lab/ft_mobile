import { StyleSheet } from "react-native";
import { scaleFontSize, spacing } from "../utils/random";
import { Colors } from "./theme";

export const Styles = StyleSheet.create({
  sm15: {
    fontSize: scaleFontSize(15),
    lineHeight: 19,
    fontFamily: "semibold",
  },
  bold32: {
    fontSize: scaleFontSize(32),
    lineHeight: 40,
    fontFamily: "bold",
    color: Colors.text.white,
  },
  reg14: {
    fontSize: scaleFontSize(14),
    fontFamily: "regular",
    color: Colors.text.white,
  },
  reg16: {
    fontSize: scaleFontSize(16),
    fontFamily: "regular",
    color: Colors.text.white,
  },
  reg12: {
    fontSize: scaleFontSize(12),
    fontFamily: "regular",
    color: Colors.text.white,
  },
  bold12: {
    fontSize: scaleFontSize(12),
    fontFamily: "bold",
    color: Colors.text.white,
  },
  med16: {
    fontSize: scaleFontSize(16),
    fontFamily: "medium",
    color: Colors.text.white,
  },
  med12: {
    fontSize: scaleFontSize(12),
    fontFamily: "medium",
    color: Colors.text.white,
  },
  med14: {
    fontSize: scaleFontSize(14),
    fontFamily: "medium",
    color: Colors.text.white,
  },
  inputContainer: {
    gap: spacing(5),
    justifyContent: "flex-start",
  },
  label: {
    fontFamily: "medium",
    fontSize: scaleFontSize(14),
    color: Colors.label,
  },
  input: {
    borderColor: Colors.inputBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing(15),
    paddingVertical: spacing(14),
    height: 48,
    color: Colors.black,
    fontFamily: "regular",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  inputFontPadding: {
    color: Colors.black,
    fontFamily: "regular",
    textAlignVertical: "center",
    includeFontPadding: false,
    height: 48,
  },
  input2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: "regular",
    borderColor: Colors.inputBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing(15),
    paddingVertical: spacing(5),
    height: 48,
    color: Colors.black,
  },
  pickerBtn: {
    borderColor: Colors.inputBorder,
    borderRightWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing(10),
    paddingRight: spacing(5),
    marginRight: spacing(10),
  },
  countryFlag: {
    fontSize: scaleFontSize(12),
    marginRight: spacing(10),
  },
  errorText: {
    color: "red",
    fontSize: scaleFontSize(12),
    fontFamily: "regular",
    marginTop: spacing(5),
  },
});
