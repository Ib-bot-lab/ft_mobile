import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { LoyaltyMember } from "@/src/types/crm";
import {
  CapitalizeFirstName,
  FormatNairaShorthand,
  FormatOrderDate,
  scale,
  spacing,
} from "@/src/utils/random";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import { Award, Crown, Star } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { HapticTab } from "../haptic-tab";
import { toDate } from "../invoice/util";

type Props = {
  item: LoyaltyMember;
};

const CrmItem = ({ item }: Props) => {
  const { isDark } = useTheme();

  const isGold = item.level.toLowerCase() === "gold";
  const isPlatinum = item.level.toLowerCase() === "platinum";

  const iconColor = isGold
    ? "rgba(166, 95, 0, 1)"
    : isPlatinum
      ? "rgba(130, 0, 219, 1)"
      : "rgba(54, 65, 83, 1)";
  const bgColor = isGold
    ? "rgba(254, 249, 194, 1)"
    : isPlatinum
      ? "rgba(243, 232, 255, 1)"
      : "rgba(229, 231, 235, 1)";

  const Icon = isGold ? Award : isPlatinum ? Crown : Star;

  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(249, 250, 251, 1)";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(74, 85, 101, 1)";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const subTextColor = isDark ? "rgba(160,160,160,1)" : Colors.text.gray;
  const dividerColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0, 0, 0, 0.1)";

  return (
    <HapticTab
      style={[styles.container, { backgroundColor: cardBg, borderColor: cardBorder }]}
      onPress={() =>
        router.push({
          pathname: "/protected/loyalty-member/[id]",
          params: { id: item.id ?? "" },
        })
      }
    >
      <View style={[styles.startRow, { gap: spacing(12), alignItems: "flex-start" }]}>
        <View style={[styles.iconWrapper, { backgroundColor: bgColor }]}>
          <Icon size={scale(16)} color={iconColor} />
        </View>
        <View style={styles.content}>
          <Text style={[Styles.reg14, { lineHeight: 20, color: textColor }]}>
            {item.name}
          </Text>
          <Text style={[Styles.reg12, { lineHeight: 16, color: subTextColor }]}>
            {item.email}
          </Text>

          <View style={styles.rowGap}>
            <View style={styles.startRow}>
              <AntDesign name="star" size={scale(10)} color="rgba(240, 177, 0, 1)" />
              <Text style={[Styles.reg12, { lineHeight: 16, color: subTextColor }]}>
                {item.points} pts
              </Text>
            </View>
            <Text style={[Styles.reg12, { lineHeight: 16, color: subTextColor }]}>•</Text>
            <Text style={[Styles.reg12, { lineHeight: 16, color: subTextColor }]}>
              {FormatNairaShorthand(item.totalSpent.toString())}
            </Text>
          </View>

          <View
            style={[
              styles.row,
              {
                paddingVertical: spacing(11),
                borderTopColor: dividerColor,
                borderTopWidth: 0.3,
                flexShrink: 1,
                gap: spacing(25),
              },
            ]}
          >
            <View style={{ gap: spacing(4) }}>
              <Text style={[Styles.reg12, { lineHeight: 16, color: subTextColor }]}>
                Member Since
              </Text>
              <Text style={[Styles.reg14, { lineHeight: 16, color: textColor }]}>
                {FormatOrderDate(toDate(item.createdAt).toDateString(), true)}
              </Text>
            </View>
            <View style={{ gap: spacing(4) }}>
              <Text style={[Styles.reg12, { lineHeight: 16, color: subTextColor }]}>
                Last Purchase
              </Text>
              <Text style={[Styles.reg14, { lineHeight: 16, color: textColor }]}>
                {FormatOrderDate(toDate(item.lastActivity).toDateString(), false)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.badgeView, { backgroundColor: bgColor }]}>
        <Text style={[Styles.reg12, { lineHeight: 16, color: iconColor }]}>
          {CapitalizeFirstName(item.level)}
        </Text>
      </View>
    </HapticTab>
  );
};

export default CrmItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: spacing(16),
    gap: spacing(12),
    borderWidth: 0.2,
    borderRadius: 16,
    flexWrap: "wrap",
  },
  iconWrapper: {
    width: 48,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  content: {
    gap: spacing(12),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowGap: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing(18),
  },
  startRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing(4),
  },
  badgeView: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(8),
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
});
