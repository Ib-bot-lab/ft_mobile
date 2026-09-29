import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * SafeAreaView that excludes the top edge so content renders behind the status bar.
 * Use this everywhere instead of the raw SafeAreaView.
 */
const AppSafeAreaView = ({ children, style }: Props) => {
  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={style}>
      {children}
    </SafeAreaView>
  );
};

export default AppSafeAreaView;
