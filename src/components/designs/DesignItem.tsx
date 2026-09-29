import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { Design } from "@/src/types/designs";
import { CapitalizeFirstName, FormatCurrency, FormatDateToYYYYMMDD, scale, scaleFontSize, spacing } from "@/src/utils/random";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { HapticTab } from "../haptic-tab";

const HEIGHT = 270;
type Props = { item: Design; style?: StyleProp<ViewStyle> };

const DesignItem: React.FC<Props> = ({ item, style }) => {
  const { isDark } = useTheme();
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#F9FAFB";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const subText = isDark ? "rgba(160,160,160,1)" : Colors.text.gray;

  return (
    <HapticTab
      style={[styles.container, { backgroundColor: cardBg }, style]}
      onPress={() => router.push({ pathname: "/protected/view-design/[id]", params: { id: item.id } })}
    >
      <Image
        source={{ uri: item.imageUrl?.trim() ? item.imageUrl : "https://ui-avatars.com/api/?name=Fashion+Tally&background=0D8ABC&color=fff&size=128" }}
        style={styles.image}
      />
      <View style={styles.colText}>
        <Text style={[styles.reg14, { color: textColor }]}>{CapitalizeFirstName(item.name)}</Text>
        <Text style={[styles.reg14, { color: subText }]}>{FormatDateToYYYYMMDD(item.createdAt?.toString())}</Text>
        <View style={styles.row}>
          <Text style={[styles.reg14, { color: Colors.primary }]}>{FormatCurrency(item.price)}</Text>
          <ChevronRight size={scale(10)} color={isDark ? "rgba(120,120,120,1)" : "#99A1AF"} height={16} />
        </View>
      </View>
    </HapticTab>
  );
};

export default DesignItem;

const styles = StyleSheet.create({
  container: { width: "48%", borderRadius: 16 },
  image: { width: "100%", height: HEIGHT * 0.6, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  colText: { padding: spacing(12), gap: spacing(4) },
  reg14: { fontFamily: "regular", fontSize: scaleFontSize(14) },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
