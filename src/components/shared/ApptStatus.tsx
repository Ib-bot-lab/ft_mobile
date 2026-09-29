import { AppointmentStatus } from "@/src/types/appointment";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  status: AppointmentStatus;
};

const statusConfigs: Record<AppointmentStatus, { bg: string; text: string }> = {
  pending: { bg: "#E0E7FF", text: "#4338CA" },
  // confirmed: { bg: "rgba(220, 252, 231, 1)", text: "rgba(0, 130, 54, 1)" },
  // "in-progress": { bg: "#FEF9C3", text: "#854D0E" },
  completed: { bg: "#D1FAE5", text: "#065F46" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
};

const ApptStatus = ({ status }: Props) => {
  const theme = statusConfigs[status] ?? { bg: "#E0E7FF", text: "#4338CA" };

  const formatStatus = (str: string) => {
    return str.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <View style={[styles.badge, { backgroundColor: theme?.bg }]}>
      <Text style={[styles.text, { color: theme?.text }]}>
        {formatStatus(status)}
      </Text>
    </View>
  );
};

export default ApptStatus;

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "flex-start",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
