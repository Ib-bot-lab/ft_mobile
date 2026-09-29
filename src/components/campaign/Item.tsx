import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { EmailCampaign } from "@/src/types/crm";
import { CapitalizeFirstName, scale, spacing } from "@/src/utils/random";
import { Mail } from "lucide-react-native";
import React from "react";
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  item: EmailCampaign;
};

const CampaignItem = ({ item }: Props) => {
  const isSent = item.status === "sent";
  const isSchduled = item.status === "scheduled";

  const textColor = isSent
    ? "rgba(0, 130, 54, 1)"
    : isSchduled
    ? "rgba(20, 71, 230, 1)"
    : "rgba(166, 95, 0, 1)";
  const bgColor = isSent
    ? "rgba(220, 252, 231, 1)"
    : isSchduled
    ? "rgba(243, 232, 255, 1)"
    : "rgba(229, 231, 235, 1)";

  const viewEmail = async () => {
    const subject = encodeURIComponent(item.subject ?? item.name ?? "Campaign");
    const bodyText = `${!item.content.trim() ? "No Content" : item.content}`;
    const body = encodeURIComponent(bodyText);
    const toRaw = item.recipients?.length ? item.recipients.join(",") : "";

    const to = encodeURIComponent(toRaw || "");

    // build query params
    const params = new URLSearchParams();
    if (subject) params.set("subject", decodeURIComponent(subject));
    if (body) params.set("body", decodeURIComponent(body));

    const base = to ? `mailto:${to}` : "mailto:";
    const url = `${base}?${params.toString()}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "No email app",
          "No email application is available to open."
        );
      }
    } catch (err) {
      console.warn("Unable to open mail app", err);
      Alert.alert("Error", "Unable to open email composer.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={{ gap: spacing(8), flexShrink: 1 }}>
          <Text
            style={[Styles.med14, { lineHeight: 20, color: Colors.text.black }]}
          >
            {item.name}
          </Text>

          <Text
            style={[
              Styles.reg14,
              { lineHeight: 20, color: "rgba(54, 65, 83, 1)" },
            ]}
          >
            {item.subject}
          </Text>
        </View>
        <View style={[styles.badgeView, { backgroundColor: bgColor }]}>
          <Text style={[Styles.reg12, { lineHeight: 16, color: textColor }]}>
            {CapitalizeFirstName(item.status)}
          </Text>
        </View>
      </View>

      <Text
        style={[Styles.med14, { lineHeight: 20, color: Colors.text.black }]}
      >
        Recipient:{" "}
        <Text style={{ color: Colors.text.gray }}> {item.recipientCount}</Text>
      </Text>

      <Pressable style={styles.btn} onPress={viewEmail}>
        <Mail size={scale(16)} color={"rgba(54, 65, 83, 1)"} />
        <Text
          style={[
            Styles.reg14,
            { lineHeight: 20, color: "rgba(54, 65, 83, 1)" },
          ]}
        >
          View
        </Text>
      </Pressable>
    </View>
  );
};

export default CampaignItem;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(249, 250, 251, 1)",
    padding: spacing(16),
    gap: spacing(12),
    borderWidth: 0.2,
    borderColor: "rgba(74, 85, 101, 1)",
    borderRadius: 16,
  },
  btn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing(8),
    height: 38,
    borderWidth: 1.1,
    borderColor: "rgba(209, 213, 220, 1)",
    borderRadius: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  badgeView: {
    // width: "20%",
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(8),
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
});
