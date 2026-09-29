import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { Expense, Income } from "@/src/types/finance";
import {
  FormatCurrency,
  FormatOrderDate,
  scale,
  scaleFontSize,
  spacing,
} from "@/src/utils/random";
import { router } from "expo-router";
import { ArrowUpCircle, Calendar, ChevronRight } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  item: Income | Expense;
  pressable?: boolean;
};

const TransactionItem = ({ item, pressable = true }: Props) => {
  const { isDark } = useTheme();

  const isExpense = item.type !== "income";

  const iconBg = isExpense
    ? isDark ? "rgba(193,0,7,0.2)" : "rgba(255, 226, 226, 1)"
    : isDark ? "rgba(0,100,50,0.25)" : "rgba(220, 252, 231, 1)";
  const amountColor = isExpense ? "rgba(231, 0, 11, 1)" : "rgba(0, 166, 62, 1)";

  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(249, 250, 251, 0.2)";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(74, 85, 101, 1)";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const subTextColor = isDark ? "rgba(140,140,140,1)" : "rgba(106, 114, 130, 1)";
  const chevronColor = isDark ? "rgba(120,120,120,1)" : "rgba(74, 85, 101, 1)";

  return (
    <Pressable
      style={[styles.container, { backgroundColor: cardBg, borderColor: cardBorder }]}
      onPress={() => {
        if (!pressable) return;
        router.push({ pathname: "/protected/transaction/[id]", params: { id: item.id } });
      }}
    >
      <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
        <ArrowUpCircle size={scale(20)} color={amountColor} />
      </View>
      <View style={styles.details}>
        <View style={[styles.row, { flexShrink: 1 }]}>
          <Text style={[Styles.reg14, { color: textColor }]} numberOfLines={1}>
            {item.description}
          </Text>
          <Pressable hitSlop={20}>
            <ChevronRight size={scale(16)} color={chevronColor} />
          </Pressable>
        </View>

        <View style={[styles.startRow, { gap: spacing(5) }]}>
          <Text style={[Styles.reg16, { color: subTextColor }]}>{"•"}</Text>
          <View style={[styles.startRow, { gap: spacing(5) }]}>
            <Calendar size={scale(12)} color={subTextColor} />
            <Text style={[Styles.reg12, { color: subTextColor }]}>
              {FormatOrderDate(item.date, false)}
            </Text>
          </View>
        </View>

        <View style={[styles.row, { flexShrink: 1 }]}>
          <Text style={[Styles.reg16, { color: subTextColor }]} numberOfLines={1}>
            {item.notes ? item.notes : "No notes"}
          </Text>
          <Text style={[styles.reg18, { color: amountColor }]}>
            {isExpense ? "-" : "+"}
            {FormatCurrency(item.amount)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default TransactionItem;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(8),
    gap: spacing(12),
    borderWidth: 0.3,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconWrapper: {
    width: 48,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  startRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  details: {
    flex: 1,
    gap: spacing(8),
    flexShrink: 1,
  },
  reg18: {
    fontFamily: "medium",
    fontSize: scaleFontSize(18),
  },
});
