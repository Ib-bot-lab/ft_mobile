import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface GlassCardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, style }) => {
  return (
    <View style={[styles.wrapper, style]}>
      {children}
    </View>
  );
};

export default GlassCard;

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow: "hidden",
    // Semi-transparent white — see-through but visible
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    // Glass border — top/left lighter to simulate light reflection
    borderWidth: 1,
    borderTopColor:   "rgba(255, 255, 255, 0.5)",
    borderLeftColor:  "rgba(255, 255, 255, 0.4)",
    borderBottomColor:"rgba(255, 255, 255, 0.15)",
    borderRightColor: "rgba(255, 255, 255, 0.15)",
  },
});
