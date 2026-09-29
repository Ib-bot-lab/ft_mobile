import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useAppointmentStore } from "@/src/stores/appointmentSlice";
import { Appointment } from "@/src/types/appointment";
import {
  CapitalizeFirstName,
  GetDetailedDate,
  scale,
  spacing,
} from "@/src/utils/random";
import { router } from "expo-router";
import {
  Calendar,
  Clock,
  Info,
  Phone,
  Trash2,
  User,
} from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { formatFirestoreTimestamp } from "../invoice/util";

const getTimeFromISO = (value?: string | Date): string => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "";
  return `${date.getHours() % 12 || 12}:${date.getMinutes().toString().padStart(2, "0")}`;
};

type Props = { item: Appointment };

const ClientApptItem = ({ item }: Props) => {
  const { isDark } = useTheme();

  const isCompleted = item.status === "completed";
  const isCancelled = item.status === "cancelled";

  const badgeText = isCompleted ? "rgba(0, 130, 54, 1)" : isCancelled ? "rgba(193, 0, 7, 1)" : "rgba(0, 130, 54, 1)";
  const badgeBg = isDark
    ? isCompleted ? "rgba(0,100,50,0.25)" : isCancelled ? "rgba(193,0,7,0.2)" : "rgba(0,100,50,0.25)"
    : isCompleted ? "rgba(220, 252, 231, 1)" : isCancelled ? "rgba(255, 226, 226, 1)" : "rgba(220, 252, 231, 1)";

  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(249, 250, 251, 1)";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(106, 114, 130, 1)";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const subTextColor = isDark ? "rgba(160,160,160,1)" : "rgba(106, 114, 130, 1)";
  const iconBg = isDark ? "rgba(22,152,141,0.15)" : "rgba(232, 245, 244, 1)";

  const loading = useAppointmentStore((state) => state.loading);
  const deleteAppointment = useAppointmentStore((state) => state.deleteAppointment);

  const handleDeleteAppt = () => {
    Alert.alert(
      "Delete Appointment",
      "Are you sure you want to delete this appointment? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAppointment(item.id);
            } catch (error) {
              console.error("Error deleting appointment:", error);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <Pressable
      style={[styles.apptContainer, { backgroundColor: cardBg, borderColor: cardBorder }]}
      onPress={() => router.push({ pathname: "/protected/appointment/[id]", params: { id: item.id } })}
    >
      <View style={[styles.row, { alignItems: "flex-start" }]}>
        <View style={[styles.gapRow, { gap: spacing(12), justifyContent: "flex-start", alignItems: "flex-start" }]}>
          <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
            <Calendar size={scale(18)} color={Colors.primary} />
          </View>
          <View style={[styles.col, { gap: spacing(4) }]}>
            <Text style={[Styles.reg14, { color: textColor }]}>
              {CapitalizeFirstName(item.service ? item.service : item.purpose)}
            </Text>
            <View style={[styles.gapRow, { justifyContent: "flex-start", gap: spacing(4) }]}>
              <User size={scale(12)} color={subTextColor} />
              <Text style={[Styles.reg12, { color: subTextColor }]}>{item.clientName}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.badgeView, { backgroundColor: badgeBg, borderWidth: 1, borderColor: badgeText }]}>
          <Text style={[Styles.reg12, { lineHeight: 16, color: badgeText }]}>
            {CapitalizeFirstName(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.clientDetails}>
        <View style={[styles.startRow, { gap: spacing(8) }]}>
          <Clock size={scale(16)} color={Colors.primary} />
          <Text style={[Styles.reg14, { color: textColor }]}>
            {typeof item.date === "object"
              ? formatFirestoreTimestamp(item.date as any)
              : GetDetailedDate(item.date)}
          </Text>
        </View>

        <View style={[styles.startRow, { gap: spacing(8) }]}>
          <Phone size={scale(16)} color={Colors.primary} />
          <Text style={[Styles.reg14, { color: textColor }]}>{item.clientPhone}</Text>
        </View>

        <View style={[styles.startRow, { gap: spacing(8) }]}>
          <Text style={[Styles.med14, { color: textColor }]}>To-do:</Text>
          <Text style={[Styles.reg14, { color: textColor, flexShrink: 1 }]}>
            {item.notes ? item.notes : "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.gapRow, { gap: spacing(12) }]}>
          <View style={[styles.gapRow, { gap: spacing(4) }]}>
            <Info size={scale(12)} color={subTextColor} />
            <Text style={[Styles.reg12, { color: subTextColor }]}>24hr reminder</Text>
          </View>

          <View style={styles.duration}>
            <Text style={[Styles.reg12, { color: "white" }]}>
              Duration: {item.duration} hours
            </Text>
          </View>
        </View>

        <Pressable
          hitSlop={20}
          style={{ width: 30, aspectRatio: 1, justifyContent: "center", alignItems: "center" }}
          onPress={handleDeleteAppt}
        >
          {loading ? (
            <ActivityIndicator size="small" color="red" />
          ) : (
            <Trash2 size={scale(15)} color="red" />
          )}
        </Pressable>
      </View>
    </Pressable>
  );
};

export default ClientApptItem;

const styles = StyleSheet.create({
  apptContainer: {
    padding: spacing(16),
    borderWidth: 0.3,
    borderRadius: 16,
    gap: spacing(12),
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
  col: {
    gap: spacing(16),
  },
  gapRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing(8),
  },
  iconWrapper: {
    width: 48,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  badgeView: {
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(8),
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  clientDetails: {
    gap: spacing(8),
  },
  duration: {
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(7),
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
});
