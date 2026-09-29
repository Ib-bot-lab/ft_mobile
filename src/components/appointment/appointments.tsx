import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useAppointmentStore } from "@/src/stores/appointmentSlice";
import { useUserStore } from "@/src/stores/userSlice";
import { spacing } from "@/src/utils/random";
import React, { useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import AppoinmentListItem from "./appoinmentListItem";

const AppointmentsList = () => {
  const { isDark } = useTheme();
  const user = useUserStore((state) => state.user);
  const appointments = useAppointmentStore((state) => state.appointments);
  const loading = useAppointmentStore((state) => state.loading);
  const fetchAppointments = useAppointmentStore((state) => state.getAppointmentsByTailor);

  const emptyBg = isDark ? "rgba(255,255,255,0.03)" : "white";
  const emptyTextColor = isDark ? "rgba(160,160,160,1)" : Colors.text.gray;

  const isToday = (dateInput: string | { seconds: number; nanoseconds: number }): boolean => {
    let date: Date;
    if (typeof dateInput === "object" && "seconds" in dateInput) {
      date = new Date(dateInput.seconds * 1000);
    } else {
      date = new Date(dateInput);
    }
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const todaysAppointments = appointments.filter((appt) => isToday(appt.createdAt));

  useEffect(() => {
    if (user) fetchAppointments("");
  }, [user]);

  if (!todaysAppointments || todaysAppointments.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: emptyBg }]}>
        <Text style={[Styles.reg14, { color: emptyTextColor }]}>No appointments today</Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsHorizontalScrollIndicator={false}
      horizontal
      contentContainerStyle={styles.scrollContainer}
    >
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size={"small"} color={Colors.primary} />
        </View>
      ) : (
        todaysAppointments.map((appt) => <AppoinmentListItem key={appt.id} item={appt} />)
      )}
    </ScrollView>
  );
};

export default AppointmentsList;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    gap: spacing(15),
  },
  emptyContainer: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
});
