import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { FormatNairaShorthand, scale, scaleFontSize, spacing } from "@/src/utils/random";
import { FontAwesome } from "@expo/vector-icons";
import { Box, CircleDollarSign, FileText } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatsBoxesProps {
  totalRevenue: number;
  revenueGrowth: number;
  activeClients: number;
  newClientsThisMonth: number;
  pendingOrders: number;
  ordersThisWeek: number;
  inventoryValue: number;
  totalInventoryItems: number;
}

const StatsBoxes: React.FC<StatsBoxesProps> = ({
  totalRevenue,
  revenueGrowth,
  activeClients,
  newClientsThisMonth,
  pendingOrders,
  ordersThisWeek,
  inventoryValue,
  totalInventoryItems,
}) => {
  const { isDark } = useTheme();

  const boxBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(249, 250, 251, 1)";
  const boxBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const subTextColor = isDark ? "rgba(160,160,160,1)" : Colors.grey;

  const isPositive = revenueGrowth >= 0;
  const statusColor = isPositive ? Colors.primary : "red";
  const displayValue = isPositive
    ? `+${revenueGrowth.toFixed(1)}%`
    : `${revenueGrowth.toFixed(1)}%`;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.box, { backgroundColor: boxBg, borderColor: boxBorder }]}>
          <View style={styles.startRow}>
            <CircleDollarSign size={scale(20)} strokeWidth={2} color={Colors.tintTabColor} />
            <Text style={[styles.med24, { color: textColor }]}>
              {FormatNairaShorthand(`${totalRevenue}`)}
            </Text>
          </View>
          <Text style={[Styles.reg14, { color: textColor }]}>Total Revenue</Text>
          <Text style={[Styles.reg12, { color: statusColor }]}>{displayValue} from last month</Text>
        </View>

        <View style={[styles.box, { backgroundColor: boxBg, borderColor: boxBorder }]}>
          <View style={styles.startRow}>
            <FontAwesome name="users" size={scale(18)} color={Colors.tintTabColor} />
            <Text style={[styles.med24, { color: textColor }]}>{activeClients}</Text>
            <Text style={[Styles.reg14, { color: subTextColor }]}>clients</Text>
          </View>
          <Text style={[Styles.reg14, { color: textColor }]}>Active Clients</Text>
          <Text style={[Styles.reg12, { color: Colors.primary }]}>
            {newClientsThisMonth} new this month
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.box, { backgroundColor: boxBg, borderColor: boxBorder }]}>
          <View style={styles.startRow}>
            <FileText size={scale(18)} strokeWidth={2} color={Colors.tintTabColor} />
            <Text style={[styles.med24, { color: textColor }]}>{pendingOrders}</Text>
            <Text style={[Styles.reg14, { color: subTextColor }]}>orders</Text>
          </View>
          <Text style={[Styles.reg14, { color: textColor }]}>Pending Orders</Text>
          <Text style={[Styles.reg12, { color: Colors.primary }]}>{ordersThisWeek} due this week</Text>
        </View>

        <View style={[styles.box, { backgroundColor: boxBg, borderColor: boxBorder }]}>
          <View style={styles.startRow}>
            <Box size={scale(20)} strokeWidth={2} color={Colors.tintTabColor} />
            <Text style={[styles.med24, { color: textColor }]}>
              {FormatNairaShorthand(`${inventoryValue}`)}
            </Text>
          </View>
          <Text style={[Styles.reg14, { color: textColor }]}>Inventory Value</Text>
          <Text style={[Styles.reg12, { color: Colors.primary }]}>
            {totalInventoryItems} items in stock
          </Text>
        </View>
      </View>
    </View>
  );
};

export default StatsBoxes;

const styles = StyleSheet.create({
  container: { gap: spacing(18) },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  box: {
    width: "47%",
    height: 130,
    padding: spacing(16),
    gap: spacing(8),
    borderRadius: 20,
    borderWidth: 1,
  },
  startRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing(8),
  },
  med24: {
    fontFamily: "medium",
    fontSize: scaleFontSize(24),
    lineHeight: 32,
  },
});
