import PrimaryButton from "@/src/components/button/PrimaryButton";
import SelectClientModal from "@/src/components/form/order/SelectClientModal";
import { HapticTab } from "@/src/components/haptic-tab";
import SelectFilterModal from "@/src/components/shared/modal/SelectFilterModal";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { getCurrentUserEmail } from "@/src/lib/auth-utils";
import { useCrmStore } from "@/src/stores/crmSlice";
import { Client } from "@/src/types/client";
import { LoyaltyMember } from "@/src/types/crm";
import {
  CapitalizeFirstName,
  formatPrice,
  numberize,
  scale,
  scaleFontSize,
  ShowToastMessage,
  spacing,
} from "@/src/utils/random";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronDown, ChevronLeft } from "lucide-react-native";
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

const LevelList = [
  {
    label: "Bronze",
    value: "Bronze",
  },
  {
    label: "Silver",
    value: "Silver",
  },
  {
    label: "Gold",
    value: "Gold",
  },
  {
    label: "Platinum",
    value: "Platinum",
  },
];

const EditLoyaltyMemberScreen = () => {
  const { id } = useLocalSearchParams();
  const loyaltyMembers = useCrmStore((state) => state.loyaltyMembers);
  const foundMember = loyaltyMembers.find((prev) => prev.id === id.toString());

  const loading = useCrmStore((state) => state.loading);
  const editLoyaltyMember = useCrmStore((state) => state.editLoyaltyMember);

  const { isDark } = useTheme();
  const { top } = useSafeAreaInsets();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : "rgba(54, 65, 83, 1)";
  const labelColor = isDark ? "rgba(160,160,160,1)" : "#4A5565";
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
  const [levelModal, setLevelModal] = useState(false);
  const toggleLevelModal = () => setLevelModal((prev) => !prev);

  const [data, setData] = useState<LoyaltyMember>({
    name: "",
    email: "",
    level: "Bronze",
    points: 0,
    totalSpent: 0,
    tailorId: getCurrentUserEmail(),
  });

  const [error, setError] = useState({
    name: "",
    email: "",
    points: "",
    totalSpent: "",
  });

  const handleDataChange = (
    field: keyof typeof data,
    value: string | number,
  ) => {
    setData({ ...data, [field]: value });
    if (error[field as keyof typeof error]) {
      setError((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      points: "",
      totalSpent: "",
    };

    if (!data.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!data.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (data.points < 0) {
      newErrors.points = "Points cannot be negative";
    }

    if (data.totalSpent < 0) {
      newErrors.totalSpent = "Total spent cannot be negative";
    }

    setError(newErrors);
    return Object.values(newErrors).every((v) => v === "");
  };

  const handleEditMemeber = async () => {
    if (!validateForm() || !foundMember?.id) return;
    try {
      const success = await editLoyaltyMember(foundMember.id, data);
      if (success) {
        ShowToastMessage({
          title: "Member updated successfully",
          from: "top",
          preset: "done",
        });
        handleBack();
      }
    } catch (error) {
      console.error("error editing memeber", error);
    }
  };

  useEffect(() => {
    if (foundMember) setData(foundMember);
  }, [foundMember]);

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <View style={{ flex: 1, paddingTop: top, backgroundColor: bg }}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.header}>
          <HapticTab
            style={{ width: 32, aspectRatio: 1, justifyContent: "center", alignItems: "center" }}
            onPress={handleBack}
          >
            <ChevronLeft size={scale(20)} color={isDark ? "rgba(200,200,200,1)" : "rgba(54, 65, 83, 1)"} strokeWidth={1.5} />
          </HapticTab>
          <Text style={[styles.reg24, { color: textColor }]}>Edit Loyalty Member</Text>
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
              {/* client picker */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Clients</Text>
                <Pressable
                  style={[Styles.input, { ...styles.row, paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder }]}
                  onPress={toggleClientModal}
                >
                  <Text style={[Styles.reg16, { color: selectedClient ? dropdownActiveColor : dropdownTextColor }]}>
                    {selectedClient ? selectedClient.name : "Select a Client from your list"}
                  </Text>
                  <ChevronDown size={scale(20)} color={chevronColor} />
                </Pressable>
              </View>

              {/* name */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>
                  Name<Text style={styles.red}> *</Text>
                </Text>
                <TextInput
                  value={data.name}
                  onChangeText={(text) => handleDataChange("name", text)}
                  placeholder="Enter member's full name"
                  placeholderTextColor={placeholderColor}
                  returnKeyType="next"
                  keyboardType="default"
                  autoCorrect={false}
                  style={[Styles.input, { paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
                {error.name ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.name}</Text> : null}
              </View>

              {/* email */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>
                  Email Address<Text style={styles.red}> *</Text>
                </Text>
                <TextInput
                  value={data.email}
                  onChangeText={(text) => handleDataChange("email", text)}
                  placeholder="Enter member's email address"
                  placeholderTextColor={placeholderColor}
                  returnKeyType="next"
                  keyboardType="email-address"
                  autoCorrect={false}
                  style={[Styles.input, { paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
                {error.email ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.email}</Text> : null}
              </View>

              {/* level */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Loyalty Level</Text>
                <Pressable
                  style={[Styles.input, { ...styles.row, paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder }]}
                  onPress={toggleLevelModal}
                >
                  <Text style={[Styles.reg16, { color: dropdownActiveColor }]}>
                    {CapitalizeFirstName(data.level)}
                  </Text>
                  <ChevronDown size={scale(20)} color={chevronColor} />
                </Pressable>
              </View>

              {/* points + total spent */}
              <View style={[styles.row, { gap: spacing(20) }]}>
                <View style={[Styles.inputContainer, { flex: 1 }]}>
                  <Text style={[Styles.label, { color: labelColor }]}>
                    Current Points<Text style={styles.red}> *</Text>
                  </Text>
                  <TextInput
                    value={data.points === 0 ? "" : data.points.toString()}
                    onChangeText={(text) => handleDataChange("points", numberize(text))}
                    placeholder="100"
                    placeholderTextColor={placeholderColor}
                    returnKeyType="next"
                    autoCorrect={false}
                    style={[Styles.input, { paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                    keyboardType="number-pad"
                  />
                  {error.points ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.points}</Text> : null}
                </View>

                <View style={[Styles.inputContainer, { flex: 1 }]}>
                  <Text style={[Styles.label, { color: labelColor }]}>
                    Total Spent (₦)<Text style={styles.red}> *</Text>
                  </Text>
                  <TextInput
                    value={data.totalSpent === 0 ? "" : formatPrice(data.totalSpent.toString())}
                    onChangeText={(text) => handleDataChange("totalSpent", numberize(text))}
                    placeholder="0"
                    placeholderTextColor={placeholderColor}
                    returnKeyType="done"
                    autoCorrect={false}
                    style={[Styles.input, { paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                    keyboardType="number-pad"
                  />
                  {error.totalSpent ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.totalSpent}</Text> : null}
                </View>
              </View>

              <View style={styles.button}>
                <PrimaryButton title="Edit Member" onPress={handleEditMemeber} loading={loading} props={{ disabled: loading }} />
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
            setData((prev) => ({
              ...prev,
              name: client.name,
              email: client?.email ?? "",
            }));
          }}
          onClose={() => setClientModal(false)}
        />
      )}
      {levelModal && (
        <SelectFilterModal
          data={LevelList}
          visible={levelModal}
          handleOption={(option) => {
            handleDataChange("level", option);
          }}
          selected={data.level}
          onClose={() => setLevelModal(false)}
        />
      )}
    </>
  );
};

export default EditLoyaltyMemberScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: spacing(8),
  },
  col: {
    gap: spacing(4),
  },
  reg12: {
    fontFamily: "regular",
    fontSize: scaleFontSize(12),
  },
  reg14: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
  },
  reg24: {
    fontFamily: "regular",
    fontSize: scaleFontSize(24),
    lineHeight: 32,
  },
  reg30: {
    fontFamily: "regular",
    fontSize: scaleFontSize(30),
    color: "white",
    lineHeight: 36,
  },
  content: {
    flex: 1,
    // paddingVertical: spacing(20),
    paddingHorizontal: 16,
    gap: spacing(14),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gapRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing(14),
  },
  red: {
    color: "rgba(251, 44, 54, 1)",
  },
  datePicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // paddingVertical: spacing(15),
    paddingHorizontal: spacing(13),
    height: 50,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
  },
  button: {
    flex: 1,
    justifyContent: "flex-end",
  },
});
