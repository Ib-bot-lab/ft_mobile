import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/hooks/auth";
import { useUserImage } from "@/src/hooks/useUserImage";
import { DrawerItem, useDrawerStore } from "@/src/stores/navigation/drawerSlice";
import { useUserStore } from "@/src/stores/userSlice";
import { scale, scaleFontSize, spacing } from "@/src/utils/random";
import { Href, usePathname, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Lock,
  LogOut,
  Mail,
  Menu,
  ShieldOff,
  X,
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "../haptic-tab";
import ImagePlaceholder from "./ImagePlaceholder";
import { DrawerListItem } from "../drawer/drawer-list-item";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.max(SCREEN_WIDTH * 0.7, 270);

// ─── Route maps ──────────────────────────────────────────────────────────────

const ROUTE_PERMISSION_MAP: Record<string, string> = {
  "/Dashboard":    "dashboard",
  "/Clients":      "clients",
  "/Inventory":    "inventory",
  "/Designs":      "designs",
  "/Orders":       "ordermanagement",
  "/Invoices":     "invoices",
  "/Appointments": "appointments",
  "/Finance":      "finances",
  "/CRM":          "crm",
  "/More":         "settings",
};

const ROUTE_LABEL_MAP: Record<string, string> = {
  "/Dashboard":    "Dashboard Analytics",
  "/Clients":      "Client Management",
  "/Inventory":    "Inventory Management",
  "/Designs":      "Design Management",
  "/Orders":       "Order Management",
  "/Invoices":     "Invoicing",
  "/Appointments": "Appointments Management",
  "/Finance":      "Financial Reports",
  "/CRM":          "CRM Tools",
  "/More":         "Settings Management",
};

// ─── Permission badge ─────────────────────────────────────────────────────────

const PermBadge = ({
  label,
  granted,
  isDark,
}: {
  label: string;
  granted: boolean;
  isDark: boolean;
}) => (
  <View
    style={[
      styles.permBadge,
      granted
        ? {
            backgroundColor: isDark ? "rgba(22,152,141,0.15)" : "rgba(22,152,141,0.08)",
            borderColor:     isDark ? "rgba(22,152,141,0.4)"  : "rgba(22,152,141,0.25)",
          }
        : {
            backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "#fef2f2",
            borderColor:     isDark ? "rgba(239,68,68,0.3)"  : "#fecaca",
          },
    ]}
  >
    <Text style={[styles.permText, { color: granted ? Colors.primary : "#ef4444" }]}>
      {granted ? "✓" : "✗"}{"  "}
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </Text>
  </View>
);

// ─── Inline sidebar ───────────────────────────────────────────────────────────

const InlineSidebar = ({
  visible,
  onClose,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}) => {
  const slideX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const prevVisible = useRef(false);

  if (prevVisible.current !== visible) {
    prevVisible.current = visible;
    Animated.parallel([
      Animated.spring(slideX, {
        toValue: visible ? 0 : -DRAWER_WIDTH,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
      }),
      Animated.timing(overlayOpacity, {
        toValue: visible ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }

  const { signOut, loading } = useAuth();
  const user = useUserStore((s) => s.user);
  const brandSetting = useUserStore((s) => s.brandSetting);
  const drawerItems = useDrawerStore((s) => s.items);
  const { getImageUri } = useUserImage();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const name =
    user?.businessName ?? brandSetting?.businessName?.trim() ?? user?.name ?? "Unknown";

  const bg          = isDark ? "#0f0f0f" : "#ffffff";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(22,152,141,0.2)";
  const textColor   = isDark ? Colors.text.white : Colors.primaryDark;
  const subColor    = isDark ? "rgba(180,180,180,1)" : Colors.label;
  const logoutBg    = isDark ? "rgba(255,60,60,0.08)" : "rgba(255,60,60,0.06)";

  const handleNav = (route: Href) => {
    onClose();
    // Small delay so the sidebar closes before navigating
    setTimeout(() => router.push(route), 150);
  };

  return (
    <>
      {/* Dim overlay behind the sidebar */}
      <Animated.View
        pointerEvents={visible ? "auto" : "none"}
        style={[styles.sidebarOverlay, { opacity: overlayOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sidebar panel */}
      <Animated.View
        style={[
          styles.sidebar,
          { width: DRAWER_WIDTH, backgroundColor: bg, transform: [{ translateX: slideX }] },
        ]}
      >
        <View style={[styles.sidebarInner, { paddingTop: top }]}>

          {/* Header: logo + close */}
          <View style={styles.sidebarHeader}>
            <View style={styles.logoRow}>
              <Image
                source={require("@/assets/images/fashion_tally_logo.png")}
                style={styles.appIcon}
              />
              <Text style={[styles.appName, { color: textColor }]}>FashionTally</Text>
            </View>
            <HapticTab hitSlop={12} onPress={onClose} style={styles.closeBtn}>
              <X size={scale(18)} color={textColor} />
            </HapticTab>
          </View>

          {/* User card */}
          <View
            style={[
              styles.userCard,
              {
                borderColor,
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(22,152,141,0.05)",
              },
            ]}
          >
            {brandSetting?.logoUrl ? (
              <Image
                source={{ uri: getImageUri(brandSetting.logoUrl) }}
                style={styles.avatar}
              />
            ) : (
              <ImagePlaceholder name={name} size={44} fontSize={16} />
            )}
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: textColor }]} numberOfLines={1}>
                {name}
              </Text>
              <Text style={[styles.userRole, { color: subColor }]} numberOfLines={1}>
                Team Member
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          {/* Nav items */}
          <ScrollView
            style={styles.navList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing(4), paddingBottom: spacing(8) }}
          >
            {drawerItems.map((item: DrawerItem) => (
              <DrawerListItem
                key={item.id}
                item={item}
                isDark={isDark}
                style={styles.listItem}
                onPress={() => handleNav(item.route)}
              />
            ))}
          </ScrollView>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          {/* Logout */}
          <HapticTab
            style={[
              styles.logOutBtn,
              { marginBottom: bottom + 16, backgroundColor: logoutBg },
            ]}
            hitSlop={20}
            onPress={signOut}
          >
            {loading ? (
              <ActivityIndicator size={scale(15)} color="#ef4444" />
            ) : (
              <>
                <LogOut size={scale(16)} color="#ef4444" />
                <Text style={styles.logOutText}>Log Out</Text>
              </>
            )}
          </HapticTab>

        </View>
      </Animated.View>
    </>
  );
};

// ─── Gate ─────────────────────────────────────────────────────────────────────

interface PermissionGateProps {
  children: React.ReactNode;
}

export function PermissionGate({ children }: PermissionGateProps) {
  const user    = useUserStore((s) => s.user);
  const pathname = usePathname();
  const { isDark } = useTheme();
  const { top, bottom } = useSafeAreaInsets();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSubAdmin = !!(user?.isAdmin && user?.invitedBy);
  if (!isSubAdmin) return <>{children}</>;

  const segment = pathname.replace(/^\/(tabs)/, "") || "/Dashboard";
  const requiredPermission = ROUTE_PERMISSION_MAP[segment];
  const shouldBlock =
    !!requiredPermission && user?.permissions?.[requiredPermission] !== true;

  const bg          = isDark ? "#0f0f0f" : "#ffffff";
  const cardBg      = isDark ? "rgba(255,255,255,0.05)" : "rgba(249,250,251,1)";
  const cardBorder  = isDark ? "rgba(255,255,255,0.08)" : "rgba(22,152,141,0.15)";
  const headColor   = isDark ? Colors.text.white : Colors.text.black;
  const subColor    = isDark ? "rgba(160,160,160,1)" : Colors.label;
  const featureLabel = ROUTE_LABEL_MAP[segment] ?? "this feature";

  return (
    <View style={styles.root}>
      {children}

      {shouldBlock && (
        <View style={[styles.overlay, { backgroundColor: bg }]}>

          {/* Top bar with menu button */}
          <View style={[styles.menuBar, { paddingTop: top + spacing(8) }]}>
            <TouchableOpacity
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.menuBtn}
              onPress={() => setSidebarOpen(true)}
              activeOpacity={0.7}
            >
              <Menu
                size={scale(22)}
                color={isDark ? Colors.text.white : Colors.text.black}
              />
            </TouchableOpacity>
          </View>

          {/* Restriction content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scroll,
              { paddingTop: spacing(16), paddingBottom: bottom + spacing(32) },
            ]}
          >
            <LinearGradient
              colors={["rgba(13,107,98,1)", "rgba(22,152,141,1)"]}
              style={styles.iconCircle}
            >
              <ShieldOff size={scale(34)} color="white" />
            </LinearGradient>

            <View style={styles.headGroup}>
              <Text style={[styles.title, { color: headColor }]}>
                Access Restricted
              </Text>
              <Text style={[styles.subtitle, { color: subColor }]}>
                You don't have permission to view{" "}
                <Text style={[styles.featureLabel, { color: Colors.primary }]}>
                  {featureLabel}
                </Text>
                .{"\n"}Contact the account owner to request access.
              </Text>
            </View>

            {/* Owner card */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardRow}>
                <View style={styles.iconWrap}>
                  <Mail size={scale(16)} color={Colors.primary} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.cardLabel, { color: subColor }]}>Account Owner</Text>
                  <Text style={[styles.cardValue, { color: headColor }]} numberOfLines={1}>
                    {user.invitedBy}
                  </Text>
                </View>
              </View>
            </View>

            {/* Permissions grid */}
            {user?.permissions && (
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.cardHeaderRow}>
                  <Lock size={scale(14)} color={Colors.primary} />
                  <Text style={[styles.sectionTitle, { color: Colors.primary }]}>
                    Your Permissions
                  </Text>
                </View>
                <View style={styles.grid}>
                  {Object.entries(user.permissions).map(([key, value]) => (
                    <PermBadge key={key} label={key} granted={!!value} isDark={isDark} />
                  ))}
                </View>
              </View>
            )}

            <Text style={[styles.hint, { color: subColor }]}>
              Reach out to{" "}
              <Text style={{ color: Colors.primary, fontFamily: "medium" }}>
                {user.invitedBy}
              </Text>{" "}
              to update your access.
            </Text>
          </ScrollView>

          {/* Inline sidebar */}
          <InlineSidebar
            visible={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isDark={isDark}
          />
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
  },

  // menu bar
  menuBar: {
    paddingHorizontal: spacing(16),
    paddingBottom: spacing(8),
  },
  menuBtn: {
    width: scale(40),
    height: scale(40),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: scale(12),
  },

  // restriction scroll
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: spacing(20),
    gap: spacing(20),
  },
  iconCircle: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(24),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing(4),
  },
  headGroup: {
    alignItems: "center",
    gap: spacing(10),
    paddingHorizontal: spacing(8),
  },
  title: {
    fontFamily: "bold",
    fontSize: scaleFontSize(24),
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
    textAlign: "center",
    lineHeight: 22,
  },
  featureLabel: { fontFamily: "semibold" },
  card: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing(16),
    gap: spacing(14),
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: spacing(12) },
  iconWrap: {
    width: scale(38), height: scale(38),
    borderRadius: scale(10),
    backgroundColor: "rgba(22,152,141,0.1)",
    justifyContent: "center", alignItems: "center",
  },
  cardBody: { flex: 1, gap: spacing(2) },
  cardLabel: { fontFamily: "regular", fontSize: scaleFontSize(12) },
  cardValue: { fontFamily: "semibold", fontSize: scaleFontSize(14) },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: spacing(6) },
  sectionTitle: {
    fontFamily: "semibold", fontSize: scaleFontSize(13),
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing(8) },
  permBadge: { paddingHorizontal: spacing(10), paddingVertical: spacing(6), borderRadius: 10, borderWidth: 1 },
  permText: { fontFamily: "medium", fontSize: scaleFontSize(12) },
  hint: {
    fontFamily: "regular", fontSize: scaleFontSize(13),
    textAlign: "center", lineHeight: 20, paddingHorizontal: spacing(16),
  },

  // ── sidebar ──────────────────────────────────────────────────────────────
  sidebarOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 10,
  },
  sidebar: {
    position: "absolute",
    top: 0, left: 0, bottom: 0,
    zIndex: 11,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  sidebarInner: {
    flex: 1,
    paddingHorizontal: spacing(16),
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing(8),
    marginBottom: spacing(20),
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(6),
  },
  appIcon: { width: 28, height: 28, resizeMode: "contain" },
  appName: { fontFamily: "medium", fontSize: scaleFontSize(20), letterSpacing: -0.5 },
  closeBtn: {
    width: scale(32), height: scale(32),
    justifyContent: "center", alignItems: "center",
    borderRadius: scale(8),
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(12),
    padding: spacing(12),
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: spacing(16),
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  userInfo: { flex: 1, gap: spacing(2) },
  userName: { fontFamily: "medium", fontSize: scaleFontSize(14) },
  userRole: { fontFamily: "regular", fontSize: scaleFontSize(12) },
  divider: { height: 1, borderRadius: 1, marginVertical: spacing(8) },
  navList: { flex: 1 },
  listItem: { height: 56, paddingHorizontal: spacing(12) },
  logOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(10),
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
    borderRadius: 12,
  },
  logOutText: { fontFamily: "medium", fontSize: scaleFontSize(14), color: "#ef4444" },
});
