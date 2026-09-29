import ClientApptList from "@/src/components/appointment/ClientApptList";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useAppointmentStore } from "@/src/stores/appointmentSlice";
import { scale, scaleFontSize, spacing } from "@/src/utils/random";
import { router, useLocalSearchParams } from "expo-router";
import { X } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ClientAppointments = () => {
  const { phone } = useLocalSearchParams();
  const { isDark } = useTheme();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const subTextColor = isDark ? "rgba(160,160,160,1)" : Colors.text.gray;
  const iconColor = isDark ? "rgba(200,200,200,1)" : "black";

  const appointments = useAppointmentStore((state) => state.appointments);
  const clientAppt = appointments.filter(
    (prev) => prev.clientPhone === phone.toString(),
  );

  const handleBack = () => {
    router.replace("/(tabs)/Clients");
  };

  return (
    <SafeAreaView edges={["left","right","bottom"]} style={{ flex: 1, backgroundColor: bg }}>
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View style={styles.rowHeader}>
          <Pressable hitSlop={20} onPress={handleBack}>
            <X size={scale(20)} color={iconColor} />
          </Pressable>

          <Text style={[styles.reg20, { flex: 1, textAlign: "center", color: textColor }]}>
            Appointments
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.rowHeader}>
            <Text style={[Styles.med16, { color: textColor }]}>
              Upcoming
            </Text>
          </View>

          <View style={styles.list}>
            <ClientApptList apptList={clientAppt} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ClientAppointments;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing(20),
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    paddingVertical: spacing(24),
    gap: spacing(10),
  },
  tabContainer: {
    paddingTop: spacing(24),
    gap: spacing(30),
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
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gapRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing(8),
  },
  reg20: {
    fontFamily: "medium",
    fontSize: scaleFontSize(20),
    lineHeight: 24,
  },
  schBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing(4),
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  list: {
    flex: 1,
    paddingTop: spacing(24),
  },
});
