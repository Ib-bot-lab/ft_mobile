import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useCrmStore } from "@/src/stores/crmSlice";
import { ClientFeedback } from "@/src/types/crm";
import {
  CapitalizeFirstName,
  FormatOrderDate,
  scale,
  scaleFontSize,
  ShowToastMessage,
  spacing,
} from "@/src/utils/random";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { MessageSquare } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { HapticTab } from "../haptic-tab";
import { toDate } from "../invoice/util";

const { width } = Dimensions.get("window");

type StarRatingProps = {
  rating: number;
  size?: number;
  inactiveColor?: string;
};

const StarRating = ({ rating, size = 24, inactiveColor = "black" }: StarRatingProps) => {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Ionicons
          key={i}
          name={i < rating ? "star" : "star-outline"}
          size={size}
          color={i < rating ? "rgba(240, 177, 0, 1)" : inactiveColor}
        />
      ))}
    </View>
  );
};

type inputProps = {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  toggleEditModal: () => void;
  onUpdate: () => Promise<void>;
  loading: boolean;
};

type Props = {
  item: ClientFeedback;
};

const FeedbackItem = ({ item }: Props) => {
  const { isDark } = useTheme();
  const loading = useCrmStore((state) => state.loading);
  const replyToFeedback = useCrmStore((state) => state.replyToFeedback);
  const updateFeedbackReply = useCrmStore((state) => state.updateFeedbackReply);

  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(249, 250, 251, 1)";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(74, 85, 101, 1)";
  const textColor = isDark ? Colors.text.white : "rgba(10, 10, 10, 1)";
  const subTextColor = isDark ? "rgba(160,160,160,1)" : "rgba(106, 114, 130, 1)";
  const bodyTextColor = isDark ? "rgba(200,200,200,1)" : "rgba(54, 65, 83, 1)";
  const resBoxBg = isDark ? "rgba(22,152,141,0.12)" : "rgba(232, 245, 244, 1)";
  const resLabelColor = isDark ? "rgba(160,160,160,1)" : "rgba(74, 85, 101, 1)";
  const resTextColor = isDark ? Colors.text.white : "rgba(16, 24, 40, 1)";
  const starInactive = isDark ? "rgba(180,180,180,1)" : "black";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "white";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : Colors.inputBorder;

  const [value, setValue] = useState(item?.reply ?? "");
  const [edit, setEdit] = useState(false);
  const toggleEditModal = () => setEdit((prev) => !prev);

  const onUpdate = async () => {
    const isEdit = !!item.reply;
    if (!item?.id) return;
    try {
      if (isEdit) {
        const success = await updateFeedbackReply(item.id, value);
        if (success) {
          ShowToastMessage({ title: "Reply updated successfully", preset: "done", from: "top" });
          toggleEditModal();
        }
      } else {
        const success = await replyToFeedback(item.id, value);
        if (success) {
          ShowToastMessage({ title: "Reply added successfully", preset: "done", from: "top" });
          toggleEditModal();
        }
      }
    } catch (error) {
      console.error("error in onUpdate", error);
    }
  };

  return (
    <HapticTab
      style={[styles.container, { backgroundColor: cardBg, borderColor: cardBorder }]}
      onPress={() => {
        if (!item.id) return;
        router.push({ pathname: "/protected/feedback/[id]", params: { id: item?.id ?? "" } });
      }}
    >
      <View style={[styles.row, { gap: spacing(20), alignItems: "flex-start" }]}>
        <LinearGradient
          colors={["rgba(22, 152, 141, 1)", "rgba(13, 107, 98, 1)"]}
          style={styles.iconWrapper}
        >
          <Text style={{ fontFamily: "regular", fontSize: scaleFontSize(18), color: "white" }}>
            {item.clientName.split("")[0].toUpperCase()}
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={[styles.row, { gap: spacing(20) }]}>
            <View style={styles.colText}>
              <Text style={[Styles.reg14, { color: textColor, flexShrink: 1 }]} numberOfLines={1}>
                {item.clientName}
              </Text>
              <StarRating rating={item.rating} size={16} inactiveColor={starInactive} />
            </View>
            <Text style={[Styles.reg12, { color: subTextColor }]}>
              {FormatOrderDate(toDate(item.createdAt).toDateString(), false)}
            </Text>
          </View>

          <Text style={[Styles.reg14, { color: bodyTextColor, flexShrink: 1 }]}>
            {item.comment}
          </Text>

          <Text style={[Styles.reg12, { color: subTextColor }]}>
            Service: {CapitalizeFirstName(item.productName)}
          </Text>

          {!edit && item.reply ? (
            <View style={[styles.resBox, { backgroundColor: resBoxBg }]}>
              <Text style={[Styles.reg12, { color: resLabelColor }]}>Your Response:</Text>
              <View style={[styles.gapRow, { alignItems: "flex-end" }]}>
                <Text style={[Styles.reg14, { color: resTextColor, flex: 1, flexShrink: 1 }]}>
                  {CapitalizeFirstName(item.reply)}
                </Text>
                <HapticTab hitSlop={20} onPress={toggleEditModal}>
                  <Text style={[Styles.reg14, { color: Colors.primary }]}>Edit</Text>
                </HapticTab>
              </View>
            </View>
          ) : (
            <HapticTab style={[styles.gapRow, { gap: spacing(5) }]} hitSlop={20} onPress={toggleEditModal}>
              <MessageSquare size={scale(16)} color={Colors.primary} />
              <Text style={[Styles.reg14, { color: Colors.primary }]}>Reply</Text>
            </HapticTab>
          )}
        </View>
      </View>

      {edit && (
        <View style={[styles.editInput, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(249,250,251,1)", borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(229,231,235,1)" }]}>
          <View style={Styles.inputContainer}>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="Type your reply...."
              placeholderTextColor={isDark ? "rgba(100,100,100,1)" : Colors.grayText}
              keyboardType="default"
              style={[
                Styles.input,
                { height: 80, textAlignVertical: "top", paddingTop: spacing(15), paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: isDark ? Colors.text.white : Colors.black },
              ]}
            />
          </View>
          <View style={styles.editBtns}>
            <HapticTab style={styles.cancelBtn} onPress={toggleEditModal} disabled={loading}>
              <Text style={[Styles.reg14, { color: "white", textAlign: "center" }]}>Cancel</Text>
            </HapticTab>
            <HapticTab style={styles.updateBtn} onPress={onUpdate} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[Styles.reg14, { color: "white", textAlign: "center" }]}>Send</Text>
              )}
            </HapticTab>
          </View>
        </View>
      )}
    </HapticTab>
  );
};

export default FeedbackItem;

const styles = StyleSheet.create({
  container: {
    padding: spacing(16),
    borderWidth: 0.2,
    borderRadius: 16,
  },
  gapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(12),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconWrapper: {
    width: 48,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  colText: {
    flexShrink: 1,
    gap: spacing(4),
  },
  content: {
    flex: 1,
    flexShrink: 1,
    gap: spacing(8),
  },
  resBox: {
    flexShrink: 1,
    padding: spacing(12),
    gap: spacing(5),
    borderRadius: 14,
  },
  editInput: {
    marginTop: spacing(20),
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(12),
    gap: spacing(15),
    borderRadius: 14,
  },
  editBtns: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing(10),
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.black,
    padding: spacing(12),
    borderRadius: 10,
  },
  updateBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: spacing(12),
    borderRadius: 10,
  },
});
