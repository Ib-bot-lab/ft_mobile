/**
 * components/notifications/NotificationPermissionModal.tsx
 *
 * Two-mode modal:
 *  - mode="ask"    → soft pre-prompt before the OS dialog
 *  - mode="denied" → tells user to open system settings to allow notifications
 */

import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { registerFCMToken } from "@/src/services/notification.service";
import { scale, scaleFontSize, spacing } from "@/src/utils/random";
import * as IntentLauncher from "expo-intent-launcher";
import { Bell, BellOff, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  mode: "ask" | "denied";
  onDismiss: () => void;
  /** Called after permission is successfully granted + token registered */
  onEnabled?: () => void;
};

const NotificationPermissionModal = ({ mode, onDismiss, onEnabled }: Props) => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);

  const bg          = isDark ? "#1a1a1a" : "white";
  const textColor   = isDark ? "rgba(240,240,240,1)" : "rgba(17,24,39,1)";
  const subColor    = isDark ? "rgba(160,160,160,1)" : "rgba(107,114,128,1)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const overlayBg   = "rgba(0,0,0,0.55)";

  // ── Open system notification settings ──────────────────────────────────────
  const openSettings = async () => {
    if (Platform.OS === "ios") {
      await Linking.openURL("app-settings:");
    } else {
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.APP_NOTIFICATION_SETTINGS,
          { data: "package:com.fashion.fashiontally" }
        );
      } catch {
        await Linking.openSettings();
      }
    }
    onDismiss();
  };

  // ── Request permission (ask mode) ──────────────────────────────────────────
  const handleEnable = async () => {
    setLoading(true);
    const token = await registerFCMToken();
    setLoading(false);
    if (token) {
      onEnabled?.();
    }
    onDismiss();
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable style={[styles.overlay, { backgroundColor: overlayBg }]} onPress={onDismiss}>
        <Pressable
          style={[styles.card, { backgroundColor: bg, borderColor }]}
          onPress={() => {}} // prevent tap-through
        >
          {/* Close button */}
          <Pressable style={styles.closeBtn} onPress={onDismiss} hitSlop={12}>
            <X size={scale(18)} color={subColor} />
          </Pressable>

          {/* Icon */}
          <View style={[styles.iconBox, { backgroundColor: mode === "ask" ? Colors.primary + "18" : "rgba(239,68,68,0.1)" }]}>
            {mode === "ask"
              ? <Bell size={scale(28)} color={Colors.primary} />
              : <BellOff size={scale(28)} color="#ef4444" />
            }
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: textColor }]}>
            {mode === "ask" ? "Enable Notifications" : "Notifications Blocked"}
          </Text>

          {/* Body */}
          <Text style={[styles.body, { color: subColor }]}>
            {mode === "ask"
              ? "Stay on top of your business — get notified about logins, orders, and important updates."
              : "You've blocked notifications for FashionTally. To receive alerts, enable them in your device settings."
            }
          </Text>

          {/* Primary action */}
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: mode === "ask" ? Colors.primary : "#ef4444" }]}
            onPress={mode === "ask" ? handleEnable : openSettings}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="white" size="small" />
              : <Text style={styles.primaryBtnText}>
                  {mode === "ask" ? "Enable Notifications" : "Open Settings"}
                </Text>
            }
          </Pressable>

          {/* Secondary — dismiss */}
          <Pressable style={styles.secondaryBtn} onPress={onDismiss}>
            <Text style={[styles.secondaryBtnText, { color: subColor }]}>
              {mode === "ask" ? "Not now" : "Dismiss"}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default NotificationPermissionModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing(24),
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing(28),
    alignItems: "center",
    gap: spacing(12),
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  closeBtn: {
    position: "absolute",
    top: spacing(16),
    right: spacing(16),
    padding: 4,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing(4),
  },
  title: {
    fontFamily: "semibold",
    fontSize: scaleFontSize(20),
    textAlign: "center",
    lineHeight: 28,
  },
  body: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing(4),
  },
  primaryBtn: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing(8),
  },
  primaryBtnText: {
    fontFamily: "semibold",
    fontSize: scaleFontSize(15),
    color: "white",
  },
  secondaryBtn: {
    paddingVertical: spacing(8),
  },
  secondaryBtnText: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
  },
});
