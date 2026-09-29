import { Colors } from "@/src/constants/theme";
import { GetInitials } from "@/src/utils/random";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  name: string;
  size: number;
  color?: string;
  fontSize: number;
  fontColor?: string;
};

const ImagePlaceholder: React.FC<Props> = ({
  name,
  size,
  fontSize,
  color = Colors.plight,
  fontColor = Colors.primary,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
        },
      ]}
    >
      <Text style={[styles.font, { fontSize, color: fontColor }]}>
        {GetInitials(name)}
      </Text>
    </View>
  );
};

export default ImagePlaceholder;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  font: {
    fontFamily: "semibold",
  },
});
