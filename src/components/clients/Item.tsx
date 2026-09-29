import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { Client } from "@/src/types/client";
import { scale, scaleFontSize, spacing } from "@/src/utils/random";
import { router } from "expo-router";
import { ChevronRight, Mail, Phone } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = { item: Client };

const ClientItem = ({ item }: Props) => {
  const { isDark } = useTheme();

  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "white";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(229, 231, 235, 1)";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const subTextColor = isDark ? "rgba(160,160,160,1)" : Colors.grey;

  return (
    <Pressable
      style={[styles.container, { backgroundColor: cardBg, borderColor: cardBorder }]}
      onPress={() => router.push({ pathname: "/protected/client/[id]", params: { id: item.id } })}
    >
      <View style={styles.row}>
        <View style={styles.details}>
          <View style={styles.gapRow}>
            <View style={styles.dot} />
            <Text style={[styles.name, { color: textColor }]}>{item.name}</Text>
          </View>

          <View style={{ gap: spacing(6) }}>
            <View style={styles.gapRow}>
              <Phone size={scale(14)} color={subTextColor} />
              <Text style={[Styles.reg14, { lineHeight: 20, color: subTextColor }]}>{item.phone}</Text>
            </View>
            <View style={styles.gapRow}>
              <Mail size={scale(14)} color={subTextColor} />
              <Text style={[Styles.reg14, { lineHeight: 20, color: subTextColor }]}>{item.email}</Text>
            </View>
          </View>
        </View>

        <ChevronRight size={scale(18)} color={isDark ? "rgba(100,100,100,1)" : Colors.iconGrey} />
      </View>
    </Pressable>
  );
};

export default ClientItem;

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing(14),
    paddingHorizontal: spacing(16),
    borderWidth: 1,
    borderRadius: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  details: {
    gap: spacing(10),
    flexShrink: 1,
  },
  gapRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing(10),
  },
  dot: {
    width: 7,
    aspectRatio: 1,
    borderRadius: 100,
    backgroundColor: Colors.primary,
  },
  name: {
    fontFamily: "medium",
    fontSize: scaleFontSize(16),
    lineHeight: 24,
  },
});
