import { HapticTab } from "@/src/components/haptic-tab";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { apiFetch } from "@/src/lib/apiClient";
import { useUserStore } from "@/src/stores/userSlice";
import { checkSubscriptionStatus } from "@/src/utils/subscription";
import { scale, scaleFontSize, spacing } from "@/src/utils/random";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { ChevronLeft, RefreshCw, Zap } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SubscriptionResult } from "@/src/utils/subscription";

const PAYMENT_URL = "https://www.fashiontally.com/login";

const STATUS_COLORS: Record<string, string> = {
  paid: Colors.primary,
  trial: "rgba(82, 135, 61, 1)",
  free: "rgba(153, 161, 175, 1)",
};

function getDaysInfo(info: SubscriptionResult | null): {
  daysUsed: number;
  totalDays: number;
  daysLeft: number;
  progress: number;
} {
  const now = new Date();

  if (info?.subscriptionEndDate && info?.subscriptionStartDate) {
    const start = new Date(info.subscriptionStartDate);
    const end = new Date(info.subscriptionEndDate);
    const total = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const used = Math.round(
      (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const left = Math.max(0, total - used);
    return {
      daysUsed: Math.min(used, total),
      totalDays: total,
      daysLeft: left,
      progress: Math.min(1, Math.max(0, used / total)),
    };
  }

  if (info?.subscriptionEndDate) {
    const end = new Date(info.subscriptionEndDate);
    const left = Math.max(
      0,
      Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );
    return { daysUsed: 30 - left, totalDays: 30, daysLeft: left, progress: (30 - left) / 30 };
  }

  return { daysUsed: 0, totalDays: 30, daysLeft: 0, progress: 1 };
}

export default function SubscriptionDetailsScreen() {
  const user = useUserStore((state) => state.user);
  const [info, setInfo] = useState<SubscriptionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : "rgba(54, 65, 83, 1)";
  const subTextColor = isDark ? "rgba(160,160,160,1)" : "rgba(54, 65, 83, 1)";
  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(249, 250, 251, 1)";
  const dividerColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(229, 231, 235, 1)";
  const progressTrackBg = isDark ? "rgba(255,255,255,0.1)" : "rgba(229, 231, 235, 1)";
  const progressLabelColor = isDark ? "rgba(160,160,160,1)" : "rgba(108, 114, 120, 1)";
  const progressSubColor = isDark ? "rgba(120,120,120,1)" : "rgba(153, 161, 175, 1)";
  const upgradeCardBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(229, 231, 235, 1)";
  const upgradeHintColor = isDark ? "rgba(160,160,160,1)" : "rgba(108, 114, 120, 1)";

  const fetchStatus = async () => {
    setLoading(true);
    try {
      // Primary: backend MongoDB via JWT — same fields the web useSubscription hook reads
      const res = await apiFetch<{ success: boolean; data: any }>("/user/get");
      const d = res.data;

      console.log("[subscription] backend user data:", JSON.stringify({
        isSubscribed: d.isSubscribed,
        subscriptionType: d.subscriptionType,
        planType: d.planType,
        isTrialActive: d.isTrialActive,
        subscriptionEndDate: d.subscriptionEndDate,
      }));

      setInfo({
        isSubscribed:          d.isSubscribed         ?? false,
        subscriptionType:      d.subscriptionType      ?? "free",
        planType:              d.planType              ?? "Free",
        subscriptionStartDate: d.trialStartDate        ?? d.subscriptionStartDate,
        subscriptionEndDate:   d.subscriptionEndDate,
        paymentAmount:         d.payment_amount,
        paymentDate:           d.payment_date,
      });
    } catch (err: any) {
      console.warn("[subscription] backend fetch failed:", err?.message ?? err);

      // Fallback 1: use the user object already stored in AsyncStorage from login.
      // loginController embeds all subscription fields directly into the JWT response
      // so the stored user is always up-to-date as of the last login.
      if (user) {
        console.log("[subscription] using stored user fields:", JSON.stringify({
          isSubscribed: user.isSubscribed,
          subscriptionType: user.subscriptionType,
          planType: user.planType,
          isTrialActive: user.isTrialActive,
        }));

        if (user.isSubscribed !== undefined) {
          setInfo({
            isSubscribed:          user.isSubscribed         ?? false,
            subscriptionType:      user.subscriptionType      ?? "free",
            planType:              user.planType              ?? "Free",
            subscriptionStartDate: user.trialStartDate        ?? user.subscriptionStartDate,
            subscriptionEndDate:   user.subscriptionEndDate,
            paymentAmount:         user.payment_amount,
            paymentDate:           user.payment_date,
          });
          return;
        }
      }

      // Fallback 2: Firebase (last resort)
      const result = await checkSubscriptionStatus(
        user?.email ?? "",
        user?.uid ?? "",
      );
      console.log("[subscription] Firebase fallback result:", JSON.stringify(result));
      setInfo(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleManage = async () => {
    try {
      const result = await WebBrowser.openBrowserAsync(PAYMENT_URL, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        showTitle: true,
      });
      if (result.type === "dismiss" || result.type === "cancel") {
        fetchStatus();
      }
    } catch {
      // fallback handled silently
    }
  };

  const statusColor =
    STATUS_COLORS[info?.subscriptionType ?? "free"] ?? STATUS_COLORS.free;

  const { daysUsed, totalDays, daysLeft, progress } = getDaysInfo(info);

  return (
    <SafeAreaView edges={["left","right","bottom"]} style={{ flex: 1, paddingTop: spacing(20), backgroundColor: bg }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {/* Header */}
      <View style={styles.header}>
        <HapticTab style={styles.backBtn} onPress={() => router.replace("/(tabs)/More")}>
          <ChevronLeft size={scale(20)} color={isDark ? "rgba(200,200,200,1)" : "rgba(54, 65, 83, 1)"} strokeWidth={1.5} />
        </HapticTab>
        <View style={styles.col}>
          <Text style={[styles.title, { color: textColor }]}>Subscription</Text>
          <Text style={[Styles.reg14, { color: subTextColor }]}>
            Manage your subscription plan
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ flexGrow: 1, paddingVertical: spacing(30) }}
      >
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : !info?.isSubscribed ? (
            <View style={styles.expiredBox}>
              <View style={styles.expiredIconWrap}>
                <Zap size={scale(32)} color={Colors.primary} fill={Colors.primary} />
              </View>
              <Text style={[styles.expiredTitle, { color: textColor }]}>Subscription Expired</Text>
              <Text style={[styles.expiredSub, { color: upgradeHintColor }]}>
                Your subscription has expired. Log in to the web to renew or upgrade your plan.
              </Text>
              <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: Colors.primary, width: "100%" }]} onPress={handleManage}>
                <Zap size={scale(15)} color="white" fill="white" />
                <Text style={styles.upgradeBtnText}>Renew Subscription</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.refreshRow} onPress={fetchStatus}>
                <RefreshCw size={scale(13)} color={Colors.text.gray} />
                <Text style={[Styles.reg12, { color: Colors.text.gray }]}>Refresh status</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Plan card */}
              <View style={[styles.card, { backgroundColor: cardBg }]}>
                <View style={styles.planRow}>
                  <View style={[styles.planIconBg, { backgroundColor: statusColor + "18" }]}>
                    <Zap size={scale(18)} color="#fff" fill={statusColor} />
                  </View>
                  <View style={styles.col}>
                    <Text style={[styles.planName, { color: textColor }]}>
                      {info?.planType ?? "Free"}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: statusColor + "18" }]}>
                      <Text style={[styles.badgeText, { color: statusColor }]}>
                        {info?.subscriptionType
                          ? info.subscriptionType.charAt(0).toUpperCase() + info.subscriptionType.slice(1)
                          : "Free"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: dividerColor }]} />

                <View style={styles.progressSection}>
                  <View style={styles.progressLabelRow}>
                    <Text style={[styles.progressLabel, { color: progressLabelColor }]}>Days remaining</Text>
                    <Text style={[styles.progressCount, { color: statusColor }]}>
                      {daysLeft} of {totalDays} days
                    </Text>
                  </View>

                  <View style={[styles.progressTrack, { backgroundColor: progressTrackBg }]}>
                    <View
                      style={[styles.progressFill, { width: `${(1 - progress) * 100}%` as any, backgroundColor: statusColor }]}
                    />
                  </View>

                  <Text style={[styles.progressSub, { color: progressSubColor }]}>
                    {daysUsed} days used · renews{" "}
                    {info?.subscriptionEndDate
                      ? new Date(info.subscriptionEndDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.refreshRow} onPress={fetchStatus}>
                <RefreshCw size={scale(13)} color={Colors.text.gray} />
                <Text style={[Styles.reg12, { color: Colors.text.gray }]}>Refresh status</Text>
              </TouchableOpacity>

              <View style={[styles.upgradeCard, { borderColor: upgradeCardBorder }]}>
                <Text style={[styles.upgradeHint, { color: upgradeHintColor }]}>
                  Log in to the web to upgrade, downgrade, or cancel your subscription.
                </Text>
                <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: statusColor }]} onPress={handleManage}>
                  <Zap size={scale(15)} color="white" fill="white" />
                  <Text style={styles.upgradeBtnText}>Manage on Web</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: spacing(8),
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(6),
  },
  backBtn: {
    width: 32,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  col: {
    gap: spacing(4),
  },
  title: {
    fontFamily: "regular",
    fontSize: scaleFontSize(24),
    lineHeight: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing(16),
    gap: spacing(16),
  },
  card: {
    borderRadius: 20,
    padding: spacing(20),
    gap: spacing(16),
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(12),
  },
  planIconBg: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(12),
    justifyContent: "center",
    alignItems: "center",
  },
  planName: {
    fontFamily: "semibold",
    fontSize: scaleFontSize(18),
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(3),
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: "medium",
    fontSize: scaleFontSize(11),
  },
  divider: {
    height: 1,
  },
  progressSection: {
    gap: spacing(8),
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontFamily: "medium",
    fontSize: scaleFontSize(13),
  },
  progressCount: {
    fontFamily: "semibold",
    fontSize: scaleFontSize(13),
  },
  progressTrack: {
    height: 8,
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
  },
  progressSub: {
    fontFamily: "regular",
    fontSize: scaleFontSize(12),
  },
  refreshRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(5),
    alignSelf: "flex-end",
  },
  expiredBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(12),
    paddingHorizontal: spacing(16),
    paddingTop: spacing(40),
  },
  expiredIconWrap: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(20),
    backgroundColor: Colors.plight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing(4),
  },
  expiredTitle: {
    fontFamily: "semibold",
    fontSize: scaleFontSize(22),
    textAlign: "center",
  },
  expiredSub: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing(8),
  },
  upgradeCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing(20),
    gap: spacing(14),
    marginTop: spacing(4),
  },
  upgradeHint: {
    fontFamily: "regular",
    fontSize: scaleFontSize(13),
    textAlign: "center",
    lineHeight: 20,
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(8),
    borderRadius: 14,
    paddingVertical: spacing(14),
  },
  upgradeBtnText: {
    fontFamily: "semibold",
    fontSize: scaleFontSize(15),
    color: "white",
  },
});
