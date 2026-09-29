import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { Measurement, useMeasurementStore } from "@/src/stores/measurementSlice";
import { Client } from "@/src/types/client";
import { scale, scaleFontSize, spacing } from "@/src/utils/random";
import { Lightbulb, Save, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { HapticTab } from "../../haptic-tab";

type Props = {
  client: Client;
  visible: boolean;
  onClose: () => void;
  /** When provided the modal is in edit mode for an existing measurement */
  editingMeasurement?: Measurement | null;
};

const AddMeasurements: React.FC<Props> = ({
  visible,
  onClose,
  client,
  editingMeasurement,
}) => {
  const addMeasurements = useMeasurementStore((s) => s.addMeasurements);
  const editMeasurement = useMeasurementStore((s) => s.editMeasurement);
  const loading = useMeasurementStore((s) => s.loading);
  const { isDark } = useTheme();

  const isEditMode = !!editingMeasurement;

  const modalBg = isDark ? "#1c1c1e" : "white";
  const sectionBg = isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB";
  const sectionBorder = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "white";
  const inputColor = isDark ? Colors.text.white : "black";
  const placeholderColor = isDark ? "rgba(120,120,120,1)" : "grey";
  const infoBg = isDark ? "rgba(43,127,255,0.12)" : "#EFF6FF";
  const infoBorder = isDark ? "rgba(43,127,255,0.2)" : "#DBEAFE";

  const [field, setField] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("inches");

  // Populate fields when editing
  useEffect(() => {
    if (editingMeasurement) {
      setField(editingMeasurement.name);
      setValue(editingMeasurement.value);
      setUnit(editingMeasurement.unit ?? "inches");
    } else {
      setField("");
      setValue("");
      setUnit("inches");
    }
  }, [editingMeasurement, visible]);

  const handleSave = async () => {
    const trimmedField = field.trim();
    const trimmedValue = value.trim();
    if (!trimmedField || !trimmedValue) return;

    let success = false;
    if (isEditMode && editingMeasurement) {
      success = await editMeasurement(editingMeasurement.id, {
        name: trimmedField,
        value: trimmedValue,
        unit,
      });
    } else {
      success = await addMeasurements(client.email, [
        { name: trimmedField, value: trimmedValue, unit },
      ]);
    }

    if (success) onClose();
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalContainer, { backgroundColor: modalBg }]}>
          {/* Title row */}
          <View style={styles.row}>
            <Text style={[styles.reg14, { color: textColor }]}>
              {isEditMode ? "Edit Measurement" : "Add Measurement"}
            </Text>
            <HapticTab hitSlop={20} onPress={onClose}>
              <X
                size={scale(18)}
                color={isDark ? "rgba(160,160,160,1)" : "black"}
              />
            </HapticTab>
          </View>

          <KeyboardAvoidingView
            style={{ backgroundColor: modalBg }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? spacing(50) : 0}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardDismissMode="interactive"
            >
              <View
                style={[
                  styles.section,
                  { backgroundColor: sectionBg, borderColor: sectionBorder },
                ]}
              >
                {/* Measurement name */}
                <View style={[Styles.inputContainer, { gap: spacing(8) }]}>
                  <Text
                    style={[
                      styles.reg12,
                      {
                        color: isDark
                          ? "rgba(160,160,160,1)"
                          : Colors.text.gray,
                      },
                    ]}
                  >
                    Measurement Name
                  </Text>
                  <TextInput
                    value={field}
                    onChangeText={setField}
                    placeholder="e.g., Chest"
                    placeholderTextColor={placeholderColor}
                    style={[
                      Styles.input,
                      {
                        fontFamily: "regular",
                        paddingVertical: 0,
                        backgroundColor: inputBg,
                        color: inputColor,
                      },
                    ]}
                  />
                </View>

                {/* Value */}
                <View style={[Styles.inputContainer, { gap: spacing(8) }]}>
                  <Text
                    style={[
                      styles.reg12,
                      {
                        color: isDark
                          ? "rgba(160,160,160,1)"
                          : Colors.text.gray,
                      },
                    ]}
                  >
                    Value
                  </Text>
                  <View style={[Styles.input2, { backgroundColor: inputBg }]}>
                    <TextInput
                      value={value}
                      onChangeText={setValue}
                      placeholder="e.g., 36"
                      placeholderTextColor={placeholderColor}
                      style={[styles.input, { color: inputColor }]}
                      keyboardType="numeric"
                    />
                    <Text
                      style={[
                        styles.reg12,
                        {
                          color: isDark ? "rgba(160,160,160,1)" : Colors.grey,
                        },
                      ]}
                    >
                      {unit}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Tip — only show on add mode */}
          {!isEditMode && (
            <View
              style={[
                styles.infoBox,
                { backgroundColor: infoBg, borderColor: infoBorder },
              ]}
            >
              <Lightbulb size={scale(15)} color="#2B7FFF" />
              <View style={{ gap: spacing(4), flexShrink: 1 }}>
                <Text
                  style={[
                    styles.reg12,
                    {
                      color: isDark ? "#7BAEFF" : "#1C398E",
                      lineHeight: 16,
                    },
                  ]}
                >
                  Tip
                </Text>
                <Text
                  style={[
                    styles.reg10,
                    { color: isDark ? "#7BAEFF" : "#1447E6" },
                  ]}
                >
                  Common: Chest, Waist, Hips, Shoulder Width, Sleeve Length,
                  Inseam, Neck, Bust, Dress Length
                </Text>
              </View>
            </View>
          )}

          {/* Save button */}
          <HapticTab onPress={handleSave} style={styles.rowBtn}>
            {loading ? (
              <ActivityIndicator size={scale(18)} color="white" />
            ) : (
              <>
                <Save size={scale(18)} color="white" />
                <Text style={styles.reg16}>
                  {isEditMode ? "Update" : "Save"}
                </Text>
              </>
            )}
          </HapticTab>
        </View>
      </View>
    </Modal>
  );
};

export default AddMeasurements;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.black80,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    borderRadius: 16,
    paddingHorizontal: spacing(20),
    paddingVertical: spacing(16),
    gap: spacing(12),
    elevation: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reg14: { fontFamily: "regular", fontSize: scaleFontSize(14) },
  reg16: { fontFamily: "regular", fontSize: scaleFontSize(16), color: "white" },
  reg12: { fontFamily: "regular", fontSize: scaleFontSize(12) },
  reg10: { fontFamily: "regular", fontSize: scaleFontSize(10) },
  section: {
    padding: spacing(17),
    borderWidth: 1,
    borderRadius: 16,
    gap: spacing(12),
  },
  rowBtn: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing(10),
    height: 45,
    borderRadius: 16,
  },
  input: {
    height: 48,
    flex: 1,
    fontFamily: "regular",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  infoBox: {
    marginVertical: spacing(4),
    padding: spacing(14),
    flexDirection: "row",
    gap: spacing(8),
    borderWidth: 1,
    borderRadius: 16,
  },
});
