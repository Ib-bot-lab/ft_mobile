import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { CalculateBoxWidth, scale, spacing } from "@/src/utils/random";
import { LucideIcon } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { HapticTab } from "../../haptic-tab";

type Props = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
};

const WIDTH = CalculateBoxWidth({ gap: 12, padding: 16, boxCount: 3 });

const ActionItem: React.FC<Props> = ({ label, icon, onPress }) => {
  const Icon = icon;
  const { isDark } = useTheme();

  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(229, 231, 235, 1)";
  const boxBg = isDark ? "rgba(255,255,255,0.04)" : "transparent";
  const iconBg = isDark ? "rgba(22,152,141,0.15)" : "rgba(232, 245, 244, 1)";
  const textColor = isDark ? Colors.text.white : Colors.text.black;

  return (
    <HapticTab style={[styles.box, { width: WIDTH, borderColor, backgroundColor: boxBg }]} onPress={onPress}>
      <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
        <Icon size={scale(15)} color={Colors.primary} />
      </View>
      <Text style={[Styles.reg12, { color: textColor, lineHeight: 16 }]} numberOfLines={1}>
        {label}
      </Text>
    </HapticTab>
  );
};

export default ActionItem;

const styles = StyleSheet.create({
  box: {
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing(6),
    gap: spacing(8),
  },
  iconWrapper: {
    width: 35,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
});
