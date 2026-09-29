import { generateAppointmentId } from "@/src/components/appointment/utils";
import PrimaryButton from "@/src/components/button/PrimaryButton";
import SelectClientModal from "@/src/components/form/order/SelectClientModal";
import { HapticTab } from "@/src/components/haptic-tab";
import SelectFilterModal from "@/src/components/shared/modal/SelectFilterModal";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useAppointmentStore } from "@/src/stores/appointmentSlice";
import { useClientStore } from "@/src/stores/clientSlice";
import { Appointment } from "@/src/types/appointment";
import { Client } from "@/src/types/client";
import {
  CapitalizeFirstName,
  GetDetailedDate,
  GetDetailedTime,
  numberize,
  scale,
  scaleFontSize,
  spacing,
} from "@/src/utils/random";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Calendar, ChevronDown, ChevronLeft } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "react-native-date-picker";

const PurposeList = [
  { label: "Consultation", value: "consultation" },
  { label: "Measurement", value: "measurement" },
  { label: "Fitting", value: "fitting" },
  { label: "Delivery", value: "delivery" },
  { label: "Alteration", value: "alteration" },
];

const apptStatusList = [
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const CreateAppoinmentScreen = () => {
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  const clients = useClientStore((state) => state.clients);
  const foundClient = clients.find((prev) => prev.id === clientId?.toString());

  const loading = useAppointmentStore((state) => state.loading);
  const createAppointment = useAppointmentStore((state) => state.saveAppointment);

  const { isDark } = useTheme();
  const { top } = useSafeAreaInsets();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : "rgba(54, 65, 83, 1)";
  const labelColor = isDark ? "rgba(160,160,160,1)" : "#4A5565";
  const subLabelColor = isDark ? "rgba(120,120,120,1)" : "#99A1AF";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "white";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : Colors.inputBorder;
  const inputTextColor = isDark ? Colors.text.white : Colors.black;
  const placeholderColor = isDark ? "rgba(100,100,100,1)" : Colors.grayText;
  const dropdownTextColor = isDark ? "rgba(200,200,200,1)" : "rgba(10, 10, 10, 0.5)";
  const dropdownActiveColor = isDark ? Colors.text.white : "rgba(10, 10, 10, 1)";
  const chevronColor = isDark ? "rgba(160,160,160,1)" : Colors.grey;

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientModal, setClientModal] = useState(false);
  const toggleClientModal = () => setClientModal((prev) => !prev);
  const [purposeModal, setPurposeModal] = useState(false);
  const togglePurposeModal = () => setPurposeModal((prev) => !prev);
  const [statusModal, setStatusModal] = useState(false);
  const toggleStatusModal = () => setStatusModal((prev) => !prev);
  const [datePickerFor, setDatePickerFor] = useState<"date" | "time" | null>(null);

  useEffect(() => {
    if (foundClient) {
      setSelectedClient(foundClient);
      setData((prev) => ({
        ...prev,
        clientId: foundClient.id,
        clientName: foundClient.name,
        clientPhone: foundClient.phone,
      }));
    }
  }, [foundClient]);

  const [data, setData] = useState<Appointment>({
    id: generateAppointmentId(),
    clientName: "",
    clientPhone: "",
    clientId: "",
    date: new Date().toISOString(),
    service: "consultation",
    purpose: "consultation",
    status: "pending",
    notes: "",
    duration: 1,
    userEmail: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [error, setError] = useState({
    clientName: "", clientPhone: "", clientId: "",
    date: "", type: "", status: "", notes: "", duration: "",
  });

  const handleDataChange = (field: keyof typeof data, value: string | number) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (error[field as keyof typeof error]) setError((prev) => ({ ...prev, [field]: "" }));
  };

  const validateAppointmentForm = () => {
    const newErrors = { clientName: "", clientPhone: "", clientId: "", date: "", type: "", status: "", notes: "", duration: "" };
    let isValid = true;
    if (!data.clientId) { newErrors.clientId = "Client is required"; isValid = false; }
    if (!data.clientName.trim()) { newErrors.clientName = "Client name is required"; isValid = false; }
    if (!data.clientPhone.trim()) { newErrors.clientPhone = "Client phone is required"; isValid = false; }
    if (!data.date) { newErrors.date = "Appointment date is required"; isValid = false; }
    if (!data.duration || data.duration < 1) { newErrors.duration = "Duration must be at least 1 hour"; isValid = false; }
    setError(newErrors);
    return isValid;
  };

  const handleCreateAppt = async () => {
    if (!validateAppointmentForm()) return;
    try {
      await createAppointment(data);
      handleBack();
    } catch (err) {
      console.error("Failed to create appointment", err);
    }
  };

  const handleBack = () => router.replace("/(tabs)/Appointments");

  const inputStyle = [Styles.input, { paddingVertical: 0, paddingHorizontal: spacing(16), backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }];

  return (
    <>
      <View style={{ flex: 1, paddingTop: top, backgroundColor: bg }}>
        <StatusBar style={isDark ? "light" : "dark"} />

        <View style={styles.header}>
          <HapticTab style={styles.backBtn} onPress={handleBack}>
            <ChevronLeft size={scale(20)} color={isDark ? "rgba(200,200,200,1)" : "rgba(54, 65, 83, 1)"} strokeWidth={1.5} />
          </HapticTab>
          <Text style={[styles.reg24, { color: textColor }]}>Create Appointment</Text>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: bg }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? spacing(50) : spacing(0)}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ flexGrow: 1, paddingVertical: spacing(30) }}
            keyboardDismissMode="interactive"
          >
            <View style={styles.content}>
              {/* client */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Clients</Text>
                <Pressable
                  style={[Styles.input, { ...styles.row, paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder }]}
                  onPress={toggleClientModal}
                >
                  <Text style={[Styles.reg16, { color: selectedClient ? dropdownActiveColor : dropdownTextColor }]}>
                    {selectedClient ? selectedClient.name : "Select a Client"}
                  </Text>
                  <ChevronDown size={scale(20)} color={chevronColor} />
                </Pressable>
              </View>

              {/* date + time */}
              <View style={[styles.row, { gap: spacing(20) }]}>
                <View style={[Styles.inputContainer, { gap: spacing(8), flex: 1 }]}>
                  <Text style={[Styles.label, { color: labelColor }]}>Date<Text style={styles.red}> *</Text></Text>
                  <Pressable
                    style={[styles.datePicker, { borderColor: inputBorder, backgroundColor: inputBg }]}
                    onPress={() => setDatePickerFor("date")}
                  >
                    <Text style={[styles.reg12, { color: data.date ? dropdownActiveColor : subLabelColor }]}>
                      {data.date ? GetDetailedDate(data.date) : "DD/MM/YYYY"}
                    </Text>
                    <Calendar size={scale(15)} color={chevronColor} />
                  </Pressable>
                  {error.date ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.date}</Text> : null}
                </View>

                <View style={[Styles.inputContainer, { gap: spacing(8), flex: 1 }]}>
                  <Text style={[Styles.label, { color: labelColor }]}>Time<Text style={styles.red}> *</Text></Text>
                  <Pressable
                    style={[styles.datePicker, { borderColor: inputBorder, backgroundColor: inputBg }]}
                    onPress={() => setDatePickerFor("time")}
                  >
                    <Text style={[styles.reg12, { color: data.date ? dropdownActiveColor : subLabelColor }]}>
                      {data.date ? GetDetailedTime(data.date) : "00:00"}
                    </Text>
                    <Calendar size={scale(15)} color={chevronColor} />
                  </Pressable>
                </View>
              </View>

              {(datePickerFor === "date" || datePickerFor === "time") && (
                <DatePicker
                  modal
                  open={!!datePickerFor}
                  date={data.date ? new Date(data.date) : new Date()}
                  mode={datePickerFor}
                  onConfirm={(date) => { handleDataChange("date", date.toISOString()); setDatePickerFor(null); }}
                  onCancel={() => setDatePickerFor(null)}
                />
              )}

              {/* purpose */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Purpose<Text style={styles.red}> *</Text></Text>
                <Pressable
                  style={[Styles.input, { ...styles.row, paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder }]}
                  onPress={togglePurposeModal}
                >
                  <Text style={[Styles.reg16, { color: dropdownActiveColor }]}>{CapitalizeFirstName(data.service)}</Text>
                  <ChevronDown size={scale(20)} color={chevronColor} />
                </Pressable>
              </View>

              {/* duration + status */}
              <View style={[styles.row, { gap: spacing(20) }]}>
                <View style={[Styles.inputContainer, { flex: 1 }]}>
                  <Text style={[Styles.label, { color: labelColor }]}>Duration (hr)<Text style={styles.red}> *</Text></Text>
                  <TextInput
                    value={data.duration === 0 ? "" : data.duration.toString()}
                    onChangeText={(text) => handleDataChange("duration", numberize(text))}
                    placeholder="2"
                    placeholderTextColor={placeholderColor}
                    keyboardType="number-pad"
                    style={inputStyle}
                  />
                  {error.duration ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.duration}</Text> : null}
                </View>

                <View style={[Styles.inputContainer, { flex: 1 }]}>
                  <Text style={[Styles.label, { color: labelColor }]}>Status</Text>
                  <Pressable
                    style={[Styles.input, { ...styles.row, paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder }]}
                    onPress={toggleStatusModal}
                  >
                    <Text style={[Styles.reg16, { color: dropdownActiveColor }]}>{CapitalizeFirstName(data.status)}</Text>
                    <ChevronDown size={scale(20)} color={chevronColor} />
                  </Pressable>
                </View>
              </View>

              {/* notes */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Notes</Text>
                <TextInput
                  value={data.notes}
                  onChangeText={(text) => handleDataChange("notes", text)}
                  placeholder="Add any additional notes..."
                  placeholderTextColor={placeholderColor}
                  multiline
                  numberOfLines={20}
                  style={[Styles.input, { height: 100, textAlignVertical: "top", paddingTop: spacing(15), paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
              </View>

              <View style={styles.button}>
                <PrimaryButton title="Create Appointment" onPress={handleCreateAppt} loading={loading} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {clientModal && (
        <SelectClientModal
          visible={clientModal}
          handleOption={(client) => {
            setSelectedClient(client);
            setData((prev) => ({ ...prev, clientId: client.id, clientName: client.name, clientPhone: client.phone }));
          }}
          onClose={() => setClientModal(false)}
        />
      )}
      {purposeModal && (
        <SelectFilterModal
          data={PurposeList}
          visible={purposeModal}
          handleOption={(option) => { handleDataChange("service", option); handleDataChange("purpose", option); }}
          selected={data.service}
          onClose={() => setPurposeModal(false)}
        />
      )}
      {statusModal && (
        <SelectFilterModal
          data={apptStatusList}
          visible={statusModal}
          handleOption={(option) => handleDataChange("status", option)}
          selected={data.status}
          onClose={() => setStatusModal(false)}
        />
      )}
    </>
  );
};

export default CreateAppoinmentScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing(8),
    paddingHorizontal: spacing(16),
    paddingTop: spacing(12),
    paddingBottom: spacing(8),
  },
  backBtn: {
    width: 32,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  reg12: { fontFamily: "regular", fontSize: scaleFontSize(12) },
  reg24: { fontFamily: "regular", fontSize: scaleFontSize(24), lineHeight: 32 },
  content: { flex: 1, paddingHorizontal: 16, gap: spacing(14) },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  red: { color: "rgba(251, 44, 54, 1)" },
  datePicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing(13),
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
  },
  button: { flex: 1, justifyContent: "flex-end" },
});
