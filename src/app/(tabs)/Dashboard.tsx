import AppointmentsList from "@/src/components/appointment/appointments";
import { OverallSalesChart } from "@/src/components/dashboard/graph/OverallSalesChart";
import StatsBoxes from "@/src/components/dashboard/stats/StatsBoxes";
import StatCircle from "@/src/components/dashboard/stats/StatsCircle";
import { HapticTab } from "@/src/components/haptic-tab";
import NotificationPermissionModal from "@/src/components/notifications/NotificationPermissionModal";
import ActionItem from "@/src/components/shared/action/item";
import ImagePlaceholder from "@/src/components/shared/ImagePlaceholder";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useDashboard } from "@/src/hooks/useDashboard";
import { useNotificationPrompt } from "@/src/hooks/useNotificationPrompt";
import { useTimeSince } from "@/src/hooks/timeSince";
import { useUserImage } from "@/src/hooks/useUserImage";
import { useUserStore } from "@/src/stores/userSlice";
import { FormatNairaShorthand, GetFormattedDate, scale, spacing } from "@/src/utils/random";
import { router, useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CalendarClock, FileText, Menu, Plus, UserRoundPlus } from "lucide-react-native";
import React, { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const GraphValue = SCREEN_WIDTH / 3 - 25;

// How many pixels to scroll before the header is fully opaque
const HEADER_SCROLL_DISTANCE = 160;

const DashboardScreen = () => {
  const { isDark } = useTheme();
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation();

  const fetchBrandSettings = useUserStore((state) => state.fetchBrandSettings);
  const timeAgo = useTimeSince();
  const { stats, loading, refresh } = useDashboard();
  const { getImageUri } = useUserImage();

  // Notification permission prompt
  const { promptState, dismiss, markEnabled } = useNotificationPrompt();

  const user = useUserStore((state) => state.user);
  const brandSetting = useUserStore((state) => state.brandSetting);
  const name =
    user?.businessName ??
    brandSetting?.businessName?.trim() ??
    user?.name ??
    "Unknown";

  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const subTextColor = isDark ? "rgba(180,180,180,1)" : Colors.text.gray;
  const bg = isDark ? "#0f0f0f" : "white";

  // Header fades to theme color on scroll
  const headerSolidColor = isDark ? "#0f0f0f" : "white";
  const themeIconColor = isDark ? Colors.text.white : Colors.text.black;

  useEffect(() => {
    fetchBrandSettings();
  }, []);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Icons/text: white when transparent (over image), theme color when header is solid
  const headerIconColor = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: ["rgba(255,255,255,1)", isDark ? "rgba(238,238,238,1)" : "rgba(17,24,39,1)"],
    extrapolate: "clamp",
  });
  const whiteIconOpacity = scrollY.interpolate({ inputRange: [0, HEADER_SCROLL_DISTANCE], outputRange: [1, 0], extrapolate: "clamp" });
  const themeIconOpacity = scrollY.interpolate({ inputRange: [0, HEADER_SCROLL_DISTANCE], outputRange: [0, 1], extrapolate: "clamp" });

  // Interpolate scroll position → header background opacity (0 → 1)
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Interpolate scroll position → content area overlap with bg image
  // The bg image area height (paddingTop + headerView paddingBottom + profile row)
  const BG_IMAGE_HEIGHT = spacing(50) + spacing(60) + spacing(15) + 80; // ~approx

  const incomeFromChart = useMemo(() => {
    if (!stats?.salesChart) return [];
    const MONTH_INDEX: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };
    return stats.salesChart.map((point, i) => {
      const monthIdx = MONTH_INDEX[point.month] ?? 0;
      return {
        id: `chart-${i}`,
        amount: point.revenue,
        date: new Date(point.year, monthIdx, 1).toISOString(),
      };
    });
  }, [stats?.salesChart]);

  const HEADER_HEIGHT = top + spacing(50);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.primary }}>
      <StatusBar style="light" />

      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={Colors.primary}
            progressViewOffset={HEADER_HEIGHT}
          />
        }
      >
        {/* Background image hero area */}
        <ImageBackground
          source={require("@/assets/images/screen_bg.png")}
          style={[styles.bgContainer, { paddingTop: top + spacing(50) }]}
        >
          {/* Profile row — always visible in the hero */}
          <View style={styles.profileRow}>
            {brandSetting?.logoUrl ? (
              <Image
                source={{ uri: getImageUri(brandSetting.logoUrl) }}
                style={{ width: 50, aspectRatio: 1, borderRadius: 100 }}
              />
            ) : (
              <ImagePlaceholder name={name} size={40} fontSize={15} />
            )}
            <View style={styles.col}>
              <Text style={styles.reg16}>Welcome back,</Text>
              <Text style={styles.bold16} numberOfLines={1}>{name}</Text>
            </View>
          </View>
        </ImageBackground>

        {/* Scrollable content card */}
        <View style={[styles.content, { backgroundColor: bg }]}>
          <View style={{ flex: 1, paddingBottom: spacing(30) }}>
            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={[Styles.med16, { color: textColor }]}>Quick Actions</Text>
              <View style={styles.actions}>
                <ActionItem
                  label="New Order"
                  onPress={() => router.push("/protected/form/create-order")}
                  icon={FileText}
                />
                <ActionItem
                  label="New Client"
                  onPress={() => router.push("/protected/form/create-client")}
                  icon={UserRoundPlus}
                />
                <ActionItem
                  label="Add Inventory"
                  onPress={() => router.push("/protected/form/create-stock")}
                  icon={Plus}
                />
              </View>
            </View>

            {/* Today's Schedule */}
            <View style={styles.section}>
              <Text style={[Styles.med14, { color: textColor }]}>Today&apos;s Schedule</Text>
              <View style={{ height: 120 }}>
                <AppointmentsList />
              </View>
            </View>

            {/* Stats */}
            {loading && !stats ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : (
              <>
                <View style={styles.section}>
                  <View style={styles.row}>
                    <Text style={[Styles.med14, { color: textColor }]}>{GetFormattedDate()}</Text>
                    <HapticTab>
                      <Text style={[Styles.reg14, { color: subTextColor }]}>{timeAgo}</Text>
                    </HapticTab>
                  </View>

                  <StatsBoxes
                    totalRevenue={stats?.totalRevenue ?? 0}
                    revenueGrowth={stats?.revenueGrowth ?? 0}
                    activeClients={stats?.activeClients ?? 0}
                    newClientsThisMonth={stats?.newClientsThisMonth ?? 0}
                    pendingOrders={stats?.pendingOrders ?? 0}
                    ordersThisWeek={stats?.ordersThisWeek ?? 0}
                    inventoryValue={stats?.inventoryValue ?? 0}
                    totalInventoryItems={stats?.totalInventoryItems ?? 0}
                  />
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <StatCircle
                    title="Completion Rate"
                    value={stats?.completionRate ?? 0}
                    size={GraphValue}
                  />
                  <StatCircle
                    title="Monthly Revenue"
                    value={stats?.revenueGrowth ?? 0}
                    size={GraphValue}
                    colorText={(stats?.revenueGrowth ?? 0) < 0 ? "red" : "green"}
                  />
                  <StatCircle
                    title="Ave. Order Value"
                    value={FormatNairaShorthand(`${stats?.averageOrderValue ?? 0}`) as any}
                    size={GraphValue}
                    isCurrency
                  />
                </View>

                <View style={[styles.section, { marginTop: spacing(20) }]}>
                  <OverallSalesChart orders={[]} income={incomeFromChart} />
                </View>
              </>
            )}
          </View>
        </View>
      </Animated.ScrollView>

      {/* Fixed overlay header — transparent → solid as you scroll */}
      <Animated.View
        style={[
          styles.overlayHeader,
          {
            height: HEADER_HEIGHT,
            paddingTop: top,
            backgroundColor: headerSolidColor,
            opacity: headerBgOpacity,
          },
        ]}
        pointerEvents="none"
      />

      {/* Fixed header icons — always visible, always on top */}
      <View
        style={[styles.overlayHeader, { height: HEADER_HEIGHT, paddingTop: top }]}
        pointerEvents="box-none"
      >
        <View style={styles.headerRow}>
          <View style={styles.startRow}>
            <HapticTab
              hitSlop={20}
              onPress={() => (navigation as any).toggleDrawer()}
              style={{ marginRight: spacing(20) }}
            >
              {/* White icon fades out, theme icon fades in */}
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: whiteIconOpacity }]}>
                <Menu size={scale(24)} color="white" />
              </Animated.View>
              <Animated.View style={{ opacity: themeIconOpacity }}>
                <Menu size={scale(24)} color={themeIconColor} />
              </Animated.View>
            </HapticTab>
            <Animated.Text style={[styles.title, { color: headerIconColor }]}>Dashboard</Animated.Text>
          </View>
          <HapticTab
            hitSlop={20}
            onPress={() => router.push("/protected/form/create-appointment")}
          >
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: whiteIconOpacity }]}>
              <CalendarClock size={scale(24)} color="white" />
            </Animated.View>
            <Animated.View style={{ opacity: themeIconOpacity }}>
              <CalendarClock size={scale(24)} color={themeIconColor} />
            </Animated.View>
          </HapticTab>
        </View>
      </View>

      {/* Notification permission modal */}
      {promptState !== "idle" && (
        <NotificationPermissionModal
          mode={promptState}
          onDismiss={dismiss}
          onEnabled={markEnabled}
        />
      )}
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  bgContainer: {
    backgroundColor: Colors.primary,
    paddingBottom: spacing(60),
    paddingTop: spacing(150),
    paddingHorizontal: 16,
    gap: spacing(15),
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(8),
    paddingTop: spacing(30),
  },
  col: {
    gap: spacing(2),
  },
  reg16: {
    fontFamily: "regular",
    fontSize: 16,
    color: "white",
    lineHeight: 20,
  },
  bold16: {
    fontFamily: "bold",
    fontSize: 16,
    color: "white",
  },
  title: {
    fontFamily: "semibold",
    fontSize: 24,
    lineHeight: 28,
    color: "white",
  },
  overlayHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    justifyContent: "flex-end",
    paddingBottom: spacing(8),
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  startRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(8),
  },
  content: {
    flex: 1,
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
    paddingHorizontal: spacing(16),
    paddingTop: spacing(30),
    marginTop: spacing(-30),
    minHeight: SCREEN_HEIGHT,
  },
  section: {
    gap: spacing(16),
    marginBottom: spacing(13),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loadingContainer: {
    paddingVertical: spacing(40),
    alignItems: "center",
  },
});
