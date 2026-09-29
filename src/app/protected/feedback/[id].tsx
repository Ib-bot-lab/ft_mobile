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
import { ClientFeedback } from "@/src/types/crm";
import {
  CapitalizeFirstName,
  scale,
  scaleFontSize,
  ShowToastMessage,
  spacing,
} from "@/src/utils/random";
import { Ionicons } from "@expo/vector-icons";
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
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUSLIST = [
  {
    label: "Pending",
    value: "pending",
  },
  {
    label: "Approved",
    value: "approved",
  },
  {
    label: "Hidden",
    value: "hidden",
  },
];

type InteractiveStarRatingProps = {
  rating: number;
  onRate: (rating: number) => void;
  size?: number;
};

const InteractiveStarRating = ({
  rating,
  onRate,
  size = 24,
}: InteractiveStarRatingProps) => {
  const handlePress = (index: number) => {
    onRate(index === rating ? 1 : index);
  };

  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {Array.from({ length: 5 }, (_, i) => {
        const starValue = i + 1;
        return (
          <TouchableOpacity key={i} onPress={() => handlePress(starValue)}>
            <Ionicons
              name={starValue <= rating ? "star" : "star-outline"}
              size={size}
              color={starValue <= rating ? "gold" : "black"}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const EditFeebackScreen = () => {
  const { id } = useLocalSearchParams();
  const clientFeedbacks = useCrmStore((state) => state.clientFeedbacks);
  const foundFeeback = clientFeedbacks.find(
    (prev) => prev.id === id.toString(),
  );

  const loading = useCrmStore((state) => state.loading);
  const editFeedback = useCrmStore((state) => state.editFeedback);

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
  const starInactiveColor = isDark ? "rgba(180,180,180,1)" : "black";

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [clientModal, setClientModal] = useState(false);
  const toggleClientModal = () => setClientModal((prev) => !prev);
  const [statusModal, setStatusModal] = useState(false);
  const toggleStatusModal = () => setStatusModal((prev) => !prev);

  const [data, setData] = useState<ClientFeedback>({
    clientName: "",
    clientEmail: "",
    rating: 5,
    comment: "",
    productName: "",
    orderNumber: "",
    invoiceNumber: "",
    status: "approved",
    isPublic: true,
    tailorId: getCurrentUserEmail(),
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

  const [error, setError] = useState({
    clientName: "",
    clientEmail: "",
    comment: "",
    productName: "",
  });

  const validateForm = () => {
    const newErrors = {
      clientName: "",
      clientEmail: "",
      comment: "",
      productName: "",
    };

    if (!data.clientName.trim()) {
      newErrors.clientName = "Client name is required";
    }

    if (!data.clientEmail.trim()) {
      newErrors.clientEmail = "Client email is required";
    } else if (!/\S+@\S+\.\S+/.test(data.clientEmail)) {
      newErrors.clientEmail = "Please enter a valid email address";
    }

    if (!data.comment.trim()) {
      newErrors.comment = "Feedback comment is required";
    }

    setError(newErrors);
    return Object.values(newErrors).every((v) => v === "");
  };

  const handleEditFeedback = async () => {
    if (!validateForm() || !foundFeeback?.id) return;
    try {
      const success = await editFeedback(foundFeeback.id, data);
      if (success) {
        ShowToastMessage({
          title: "Feedback Updated successfully",
          from: "top",
          preset: "done",
        });
        handleBack();
      }
    } catch (error) {
      console.error("error editing feedback", error);
    }
  };

  useEffect(() => {
    if (foundFeeback) setData(foundFeeback);
  }, [foundFeeback]);

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
          <Text style={[styles.reg24, { color: textColor }]}>Edit Client Feedback</Text>
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

              {/* client name */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>
                  Client Name<Text style={styles.red}> *</Text>
                </Text>
                <TextInput
                  value={data.clientName}
                  onChangeText={(text) => handleDataChange("clientName", text)}
                  placeholder="Enter client's full name"
                  placeholderTextColor={placeholderColor}
                  returnKeyType="next"
                  keyboardType="default"
                  autoCorrect={false}
                  style={[Styles.input, { paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
                {error.clientName ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.clientName}</Text> : null}
              </View>

              {/* client email */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>
                  Client Email<Text style={styles.red}> *</Text>
                </Text>
                <TextInput
                  value={data.clientEmail}
                  onChangeText={(text) => handleDataChange("clientEmail", text)}
                  placeholder="Enter client's email address"
                  placeholderTextColor={placeholderColor}
                  returnKeyType="next"
                  keyboardType="email-address"
                  autoCorrect={false}
                  style={[Styles.input, { paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
                {error.clientEmail ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.clientEmail}</Text> : null}
              </View>

              {/* rating */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>
                  Rating<Text style={styles.red}> *</Text>
                </Text>
                <InteractiveStarRating
                  rating={data.rating}
                  onRate={(rating) => handleDataChange("rating", rating)}
                  size={scale(30)}
                  inactiveColor={starInactiveColor}
                />
              </View>

              {/* comment */}
              <View style={Styles.inputContainer}>
                <Text style={[styles.reg14, { color: labelColor }]}>
                  Feedback Comment<Text style={styles.red}> *</Text>
                </Text>
                <TextInput
                  value={data.comment}
                  onChangeText={(text) => handleDataChange("comment", text)}
                  placeholder="Share your experience with our service"
                  placeholderTextColor={placeholderColor}
                  keyboardType="default"
                  multiline
                  style={[Styles.input, { height: 80, textAlignVertical: "top", paddingTop: spacing(15), paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
                {error.comment ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.comment}</Text> : null}
              </View>

              {/* product */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>
                  Product/Service<Text style={styles.red}> *</Text>
                </Text>
                <TextInput
                  value={data.productName}
                  onChangeText={(text) => handleDataChange("productName", text)}
                  placeholder="E.g. Custom wedding gown"
                  placeholderTextColor={placeholderColor}
                  returnKeyType="done"
                  autoCorrect={true}
                  style={[Styles.input, { paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
                {error.productName ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.productName}</Text> : null}
              </View>

              {/* status */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Status</Text>
                <Pressable
                  style={[Styles.input, { ...styles.row, paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder }]}
                  onPress={toggleStatusModal}
                >
                  <Text style={[Styles.reg16, { color: dropdownActiveColor }]}>
                    {CapitalizeFirstName(data.status)}
                  </Text>
                  <ChevronDown size={scale(20)} color={chevronColor} />
                </Pressable>
              </View>

              <View style={styles.button}>
                <PrimaryButton title="Edit Feedback" onPress={handleEditFeedback} loading={loading} props={{ disabled: loading }} />
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
              clientName: client.name,
              clientEmail: client?.email ?? "",
            }));
          }}
          onClose={() => setClientModal(false)}
        />
      )}
      {statusModal && (
        <SelectFilterModal
          data={STATUSLIST}
          visible={statusModal}
          handleOption={(option) => {
            handleDataChange("status", option);
          }}
          selected={data.status}
          onClose={() => setStatusModal(false)}
        />
      )}
    </>
  );
};

export default EditFeebackScreen;

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
    color: "#99A1AF",
  },
  reg14: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
    color: "#4A5565",
  },
  reg24: {
    fontFamily: "regular",
    fontSize: scaleFontSize(24),
    color: "rgba(54, 65, 83, 1)",
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
    gap: spacing(18),
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
  button: {
    flex: 1,
    justifyContent: "flex-end",
  },
});
