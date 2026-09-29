import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { Order } from "@/src/types/Order";
import { CapitalizeFirstName, FormatNairaShorthand, FormatOrderDate, scale, spacing } from "@/src/utils/random";
import { router } from "expo-router";
import { Box } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = { order: Order };

const OrderItem = ({ order }: Props) => {
  const { isDark } = useTheme();

  const isCompleted = order.status === "completed";
  const isCancelled = order.status === "cancelled";
  const badgeText = isCompleted ? "rgba(0, 130, 54, 1)" : isCancelled ? "rgba(193, 0, 7, 1)" : "rgba(0, 130, 54, 1)";
  const badgeBg = isDark
    ? isCompleted ? "rgba(0,100,50,0.25)" : isCancelled ? "rgba(193,0,7,0.2)" : "rgba(0,100,50,0.25)"
    : isCompleted ? "rgba(220, 252, 231, 1)" : isCancelled ? "rgba(255, 226, 226, 1)" : "rgba(220, 252, 231, 1)";

  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(249, 250, 251, 1)";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const subTextColor = isDark ? "rgba(160,160,160,1)" : Colors.text.gray;
  const iconBg = isDark ? "rgba(22,152,141,0.15)" : "rgba(232, 245, 244, 1)";

  return (
    <Pressable
      style={[styles.orderCard, { backgroundColor: cardBg }]}
      onPress={() => router.push({ pathname: "/protected/order/[id]", params: { id: order.id } })}
    >
      <View style={[styles.startRow, { gap: spacing(12) }]}>
        <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
          <Box size={scale(18)} color={Colors.primary} />
        </View>
        <View style={[styles.col, { gap: spacing(4) }]}>
          <Text style={[Styles.reg14, { color: textColor }]}>{CapitalizeFirstName(order.name || order.garmentDescription || order.garmentType || "Untitled Order")}</Text>
          <Text style={[Styles.reg12, { color: subTextColor }]}>{FormatOrderDate(order.createdAt)}</Text>
        </View>
      </View>

      <View style={[styles.col, { gap: spacing(4), alignItems: "flex-end" }]}>
        <Text style={[Styles.reg14, { color: textColor }]}>{FormatNairaShorthand(order.price.toString())}</Text>
        <View style={[styles.badgeView, { backgroundColor: badgeBg, borderWidth: 1, borderColor: badgeText }]}>
          <Text style={[Styles.reg12, { lineHeight: 16, color: badgeText }]}>{CapitalizeFirstName(order.status)}</Text>
        </View>
      </View>
    </Pressable>
  );
};

export default OrderItem;

const styles = StyleSheet.create({
  orderCard: { paddingVertical: spacing(16), paddingHorizontal: spacing(16), gap: spacing(12), borderRadius: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconWrapper: { width: 40, aspectRatio: 1, justifyContent: "center", alignItems: "center", borderRadius: 14 },
  startRow: { flexDirection: "row", justifyContent: "flex-start", alignItems: "center" },
  col: { gap: spacing(16) },
  badgeView: { paddingVertical: spacing(3), paddingHorizontal: spacing(8), borderRadius: 100, justifyContent: "center", alignItems: "center" },
});
