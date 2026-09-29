import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { Appointment } from "@/src/types/appointment";
import { GetAmPm, scale, spacing } from "@/src/utils/random";
import { router } from "expo-router";
import { UserRound } from "lucide-react-native";
import React from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import ApptStatus from "../shared/ApptStatus";

const getTimeFromISO = (value?: string | Date): string => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "";
  return `${date.getHours() % 12 || 12}:${date.getMinutes().toString().padStart(2, "0")}`;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Props = { item: Appointment };

const AppoinmentListItem: React.FC<Props> = ({ item }) => {
  const { isDark } = useTheme();
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "white";
  const textColor = isDark ? Colors.text.white : Colors.text.black;

  return (
    <Pressable
      style={[styles.apptView, { backgroundColor: cardBg }]}
      onPress={() => router.push({ pathname: "/protected/appointment/[id]", params: { id: item.id } })}
    >
      <View style={[styles.col, { gap: spacing(4) }]}>
        <Text style={[Styles.reg12, { color: textColor, lineHeight: 16 }]}>{getTimeFromISO(item.date)}</Text>
        <Text style={[Styles.reg12, { color: textColor, lineHeight: 16 }]}>{GetAmPm(item.date)}</Text>
      </View>

      <View style={styles.col}>
        <View style={[styles.col, { gap: spacing(4) }]}>
          <View style={[styles.startRow, { gap: spacing(8) }]}>
            <UserRound size={scale(15)} color={Colors.primary} />
            <Text style={[Styles.reg14, { color: textColor }]}>{item.clientName}</Text>
          </View>
          <Text style={[Styles.reg12, { color: textColor }]}>{item.service}</Text>
        </View>
        <ApptStatus status={item.status} />
      </View>
    </Pressable>
  );
};

export default AppoinmentListItem;

const styles = StyleSheet.create({
  apptView: {
    width: SCREEN_WIDTH - 32 * 5,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: spacing(12),
    elevation: 1,
    borderRadius: 16,
    borderLeftWidth: 5,
    borderLeftColor: "rgba(22, 152, 141, 1)",
    padding: spacing(16),
  },
  startRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing(10),
  },
  col: {
    gap: spacing(8),
  },
});
