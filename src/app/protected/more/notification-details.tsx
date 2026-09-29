import { HapticTab } from "@/src/components/haptic-tab";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import {
  getNotificationEnabled,
  getPermissionStatus,
  isPushAvailable,
  openNotificationSettings,
  toggleDeviceNotification,
} from "@/src/services/notification.service";
import { scale, scaleFontSize, spacing } from "@/src/utils/random";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Bell, BellOff, ChevronLeft, Settings, Smartphone } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";import {
  ActivityIndicator,
  AppState,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NotificationDetailsScreen = () => {
  const { isDark } = useTheme();

  const bg         = isDark ? "#0f0f0f" : "white";
  const textColor  = isDark ? Colors.text.white : "rgba(54, 65, 83, 1)";
  const subColor   = isDark ? "rgba(160,160,160,1)" : Colors.text.gray ?? Colors.grayText;
  const cardBg     = isDark ? "rgba(255,255,255,0.05)" : "rgba(249,250,251,1)";
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : Colors.inputBorder;
  const warnBg     = isDark ? "rgba(58,46,0,1)" : "#fff3cd";
  const warnColor  = isDark ? "#ffc107" : "#856404";
  const infoBg     = isDark ? "rgba(22,152,141,0.1)" : "rgba(22,152,141,0.06)";

  const [enabled, setEnabled]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [checking, setChecking]     = useState(true);
  const [statusMsg, setStatusMsg]   = useState("");
  const [permStatus, setPermStatus] = useState<"granted" | "denied" | "undetermined" | "unavailable">("undetermined");

  const refreshState = useCallback(async () => {
    setChecking(true);
    const perm = await getPermissionStatus();
    setPermStatus(perm);
    const isEnabled = await getNotificationEnabled();
    setEnabled(isEnabled);
    setChecking(false);
  }, []);

  useEffect(() => { refreshState(); }, [refreshState]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshState();
    });
    return () => sub.remove();
  }, [refreshState]);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    setStatusMsg("");

    if (!enabled) {
      if (permStatus === "denied") {
        // OS won't show dialog again — must go to settings
        setStatusMsg("Notifications are blocked. Opening settings so you can allow them.");
        setLoading(false);
        await openNotificationSettings();
        return;
      }

      // undetermined or granted — registerFCMToken calls requestPermissionsAsync
      // which shows the OS dialog if undetermined
      const ok = await toggleDeviceNotification(true);

      // Always re-read permission after the attempt so UI reflects what happened
      const perm = await getPermissionStatus();
      setPermStatus(perm);

      if (ok) {
        setEnabled(true);
        setStatusMsg("Push notifications enabled for this device.");
      } else {
        if (perm === "denied") {
          setStatusMsg("Permission denied. Tap the banner above to open settings and allow notifications.");
        } else {
          setStatusMsg("Could not enable notifications. Please try again.");
        }
      }
    } else {
      const ok = await toggleDeviceNotification(false);
      if (ok) {
        setEnabled(false);
        setStatusMsg("Push notifications disabled for this device.");
      } else {
        setStatusMsg("Failed to update. Please try again.");
      }
    }

    setLoading(false);
  };

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={{ flex: 1, paddingTop: spacing(20), backgroundColor: bg }}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={styles.header}>
        <HapticTab
          style={{ width: 32, aspectRatio: 1, justifyContent: "center", alignItems: "center" }}
          onPress={() => router.replace("/(tabs)/More")}
        >
          <ChevronLeft
            size={scale(20)}
            color={isDark ? "rgba(200,200,200,1)" : "rgba(54, 65, 83, 1)"}
            strokeWidth={1.5}
          />
        </HapticTab>
        <View style={styles.col}>
          <Text style={[styles.reg24, { color: textColor }]}>Notifications</Text>
          <Text style={[Styles.reg14, { color: subColor }]}>
            Manage push notifications
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingVertical: spacing(30) }}
        showsVerticalScrollIndicator={false}
      >
        {checking ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: spacing(40) }} />
        ) : !isPushAvailable() ? (
          <View style={[styles.msgBox, { backgroundColor: warnBg, borderColor: "transparent" }]}>
            <Text style={[Styles.reg12, { color: warnColor }]}>
              Push notifications are not available in Expo Go.{"\n\n"}
              Build the app with{" "}
              <Text style={{ fontFamily: "semibold" }}>npx expo run:android</Text>
              {" "}or{" "}
              <Text style={{ fontFamily: "semibold" }}>eas build --profile development</Text>
              {" "}to enable push notifications.
            </Text>
          </View>
        ) : (
          <>
            {/* Denied banner */}
            {permStatus === "denied" && (
              <TouchableOpacity
                style={[styles.msgBox, { backgroundColor: warnBg, borderColor: "transparent", flexDirection: "row", alignItems: "center", gap: spacing(8) }]}
                onPress={openNotificationSettings}
                activeOpacity={0.75}
              >
                <Settings size={scale(14)} color={warnColor} />
                <Text style={[Styles.reg12, { color: warnColor, flex: 1 }]}>
                  Notifications are blocked by your device. Tap to open settings and allow them for FashionTally.
                </Text>
              </TouchableOpacity>
            )}

            {/* Toggle card */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleToggle}
              disabled={loading}
              style={[
                styles.card,
                {
                  backgroundColor: enabled
                    ? (isDark ? "rgba(22,152,141,0.12)" : Colors.plight ?? "#e6f4f2")
                    : cardBg,
                  borderColor: enabled ? Colors.primary : cardBorder,
                  marginTop: permStatus === "denied" ? spacing(12) : 0,
                },
              ]}
            >
              <View style={styles.cardLeft}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: enabled
                        ? Colors.primary
                        : (isDark ? "rgba(255,255,255,0.08)" : "rgba(249,250,251,1)"),
                    },
                  ]}
                >
                  {enabled
                    ? <Bell size={scale(20)} color="white" />
                    : <BellOff size={scale(20)} color={isDark ? "rgba(160,160,160,1)" : Colors.grayText} />
                  }
                </View>

                <View style={styles.col}>
                  <Text style={[styles.cardTitle, { color: textColor }]}>
                    Push Notifications
                  </Text>
                  <Text style={[Styles.reg12, { color: subColor }]}>
                    {enabled ? "Enabled for this device" : "Tap to enable"}
                  </Text>
                </View>
              </View>

              {loading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <View style={[styles.toggle, { backgroundColor: enabled ? Colors.primary : (isDark ? "rgba(80,80,80,1)" : "#D1D5DB") }]}>
                  <View style={[styles.toggleKnob, { transform: [{ translateX: enabled ? 20 : 2 }] }]} />
                </View>
              )}
            </TouchableOpacity>

            {/* Device info */}
            {enabled && (
              <View style={[styles.deviceRow, { borderColor: cardBorder }]}>
                <Smartphone size={scale(14)} color={subColor} />
                <Text style={[Styles.reg12, { color: subColor }]}>
                  Notifications active on this device
                </Text>
              </View>
            )}

            {/* Status message */}
            {statusMsg ? (
              <TouchableOpacity
                activeOpacity={permStatus === "denied" ? 0.7 : 1}
                onPress={permStatus === "denied" ? openNotificationSettings : undefined}
                style={[styles.msgBox, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(249,250,251,1)", borderColor: cardBorder }]}
              >
                <Text style={[Styles.reg12, { color: subColor }]}>{statusMsg}</Text>
              </TouchableOpacity>
            ) : !enabled && permStatus !== "denied" ? (
              <View style={[styles.msgBox, { backgroundColor: infoBg, borderColor: "transparent" }]}>
                <Text style={[Styles.reg12, { color: subColor }]}>
                  Enable to receive login alerts, order updates, and daily business summaries from FashionTally.
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationDetailsScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: spacing(8),
    paddingHorizontal: 16,
    paddingVertical: spacing(6),
  },
  col: { gap: spacing(4) },
  reg24: {
    fontFamily: "regular",
    fontSize: scaleFontSize(24),
    lineHeight: 32,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderRadius: 16,
    padding: spacing(16),
    gap: spacing(12),
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(12),
    flex: 1,
  },
  cardTitle: {
    fontFamily: "medium",
    fontSize: scaleFontSize(14),
  },
  iconBox: {
    width: 48,
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    position: "relative",
  },
  toggleKnob: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
    top: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(6),
    paddingTop: spacing(12),
    paddingLeft: spacing(4),
  },
  msgBox: {
    marginTop: spacing(14),
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing(12),
  },
  hint: {
    marginTop: spacing(16),
    fontFamily: "regular",
    fontSize: scaleFontSize(13),
    lineHeight: 20,
    paddingHorizontal: spacing(4),
  },
});
