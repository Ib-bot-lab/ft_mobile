import { Styles } from "@/src/constants/styles";
import { Client } from "@/src/types/client";
import { scale, spacing } from "@/src/utils/random";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, Mail, Phone } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { formatFirestoreTimestamp } from "../invoice/util";
import ImagePlaceholder from "../shared/ImagePlaceholder";

type Props = {
  item: Client | undefined;
};

const ClientCard = ({ item }: Props) => {
  const fullName = item?.name;
  console.log("client. card", item);

  return (
    <LinearGradient
      colors={["rgba(22, 152, 141, 1)", "rgba(13, 107, 98, 1)"]}
      style={styles.card}
    >
      <ImagePlaceholder name={fullName ?? "N A"} size={60} fontSize={20} />
      <View style={styles.details}>
        <View style={styles.gapRow}>
          <Text style={[Styles.reg16, { color: "white", lineHeight: 24 }]}>
            {item?.name}
          </Text>
          <View style={styles.badgeView}>
            <Text
              style={[
                Styles.reg12,
                { color: "rgba(0, 130, 54, 1)", lineHeight: 16 },
              ]}
            >
              Active
            </Text>
          </View>
        </View>

        <View style={[styles.gapRow, { gap: spacing(4) }]}>
          <Mail size={scale(15)} color={"white"} />
          <Text style={[Styles.reg14, { color: "white", lineHeight: 20 }]}>
            {item?.email || "N/A"}
          </Text>
        </View>

        <View style={[styles.gapRow, { gap: spacing(4) }]}>
          <Phone size={scale(15)} color={"white"} />
          <Text style={[Styles.reg14, { color: "white", lineHeight: 20 }]}>
            {item?.phone || "N/A"}
          </Text>
        </View>

        <View style={[styles.gapRow, { gap: spacing(4) }]}>
          <Calendar size={scale(15)} color={"white"} />
          <Text style={[Styles.reg14, { color: "white", lineHeight: 20 }]}>
            {" "}
            {formatFirestoreTimestamp(item?.updatedAt as any)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

export default ClientCard;

const styles = StyleSheet.create({
  card: {
    padding: spacing(24),
    borderRadius: 24,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: spacing(20),
  },
  details: {
    gap: spacing(8),
  },
  gapRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing(8),
  },
  badgeView: {
    backgroundColor: "rgba(220, 252, 231, 1)",
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(8),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
  },
});
