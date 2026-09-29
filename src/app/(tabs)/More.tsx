import GlassCard from "@/src/components/dashboard/boxes/GlassBox";
import { HapticTab } from "@/src/components/haptic-tab";
import { MoreSection } from "@/src/constants/config";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { auth } from "@/src/context/firebase";
import { useAuth } from "@/src/hooks/auth";
import { apiFetch } from "@/src/lib/apiClient";
import { useUserStore } from "@/src/stores/userSlice";
import {
  CapitalizeFirstName,
  GetInitials,
  scale,
  scaleFontSize,
  ShowToastMessage,
  spacing,
} from "@/src/utils/random";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { ChevronRight, Mail, MapPin, Menu, Smartphone, Trash2 } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";

const HEADER_SCROLL_DISTANCE = 100;

// ─── Profile card shown in the hero ─────────────────────────────────────────
const ProfileCard = () => {
  const user = useUserStore((state) => state.user);
  const brandSetting = useUserStore((state) => state.brandSetting);

  const firebaseEmail = auth.currentUser?.email ?? "";
  const isSubAdmin = !!(user?.isAdmin && user?.invitedBy && user.invitedBy !== firebaseEmail);

  const displayName = isSubAdmin
    ? (user?.name ?? "Team Member")
    : (user?.businessName ?? brandSetting?.businessName ?? user?.name ?? "Fashion House");

  const displaySubtitle = isSubAdmin
    ? "Team Member"
    : CapitalizeFirstName(user?.name ?? "Fashion Tally");

  return (
    <GlassCard style={styles.box}>
      <View style={styles.startRow}>
        <View style={styles.placeHolder}>
          {brandSetting?.logoUrl ? (
            <Image
              source={{ uri: brandSetting.logoUrl }}
              style={styles.logoImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.med24}>{GetInitials(displayName)}</Text>
          )}
        </View>
        <View style={styles.col}>
          <Text style={[styles.med24, { color: "white", lineHeight: 28 }]}>
            {CapitalizeFirstName(displayName)}
          </Text>
          <Text style={[Styles.reg14, { color: "white" }]}>{displaySubtitle}</Text>
        </View>
      </View>

      <View style={[styles.col, { gap: spacing(8) }]}>
        <View style={styles.startRow}>
          <MapPin size={scale(14)} color={"white"} />
          <Text style={[Styles.reg14, { color: "white" }]}>
            {user?.lga}, {user?.state}
          </Text>
        </View>
        <View style={styles.startRow}>
          <Mail size={scale(14)} color={"white"} />
          <Text style={[Styles.reg14, { color: "white" }]}>{user?.email}</Text>
        </View>
        <View style={styles.startRow}>
          <Smartphone size={scale(14)} color={"white"} />
          <Text style={[Styles.reg14, { color: "white" }]}>
            {user?.phoneNumber ?? user?.phone}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────
const MoreScreen = () => {
  const { isDark } = useTheme();
  const { top, bottom } = useSafeAreaInsets();
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all associated data — clients, orders, invoices, designs, and more. This action cannot be undone.\n\nAre you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            setDeletingAccount(true);
            try {
              await apiFetch("/user/delete", { method: "DELETE" });
              ShowToastMessage({ title: "Account deleted", preset: "done", from: "top" });
              await signOut();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete account. Please try again.");
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ],
    );
  };

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const subColor = isDark ? "rgba(160,160,160,1)" : Colors.text.gray;
  const headerSolidColor = isDark ? "#0f0f0f" : "white";
  const themeIconColor = isDark ? Colors.text.white : Colors.text.black;
  const sectionBg = isDark ? "#0f0f0f" : "rgba(249, 250, 251, 1)";
  const sectionBorder = isDark ? "rgba(255,255,255,0.1)" : "transparent";

  const scrollY = useRef(new Animated.Value(0)).current;

  const whiteIconOpacity = scrollY.interpolate({ inputRange: [0, HEADER_SCROLL_DISTANCE], outputRange: [1, 0], extrapolate: "clamp" });
  const themeIconOpacity = scrollY.interpolate({ inputRange: [0, HEADER_SCROLL_DISTANCE], outputRange: [0, 1], extrapolate: "clamp" });
  const headerIconColor = scrollY.interpolate({ inputRange: [0, HEADER_SCROLL_DISTANCE], outputRange: ["rgba(255,255,255,1)", isDark ? "rgba(238,238,238,1)" : "rgba(17,24,39,1)"], extrapolate: "clamp" });

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [HEADER_SCROLL_DISTANCE * 0.5, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const HEADER_HEIGHT = top + spacing(56);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.primary }}>
      <StatusBar style="light" />

      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Hero — scrolls away */}
        <ImageBackground
          source={require("@/assets/images/screen_bg.png")}
          style={[styles.heroBg, { paddingTop: top + spacing(56) }]}
        >
          <View style={{ paddingHorizontal: 16, paddingBottom: spacing(24), gap: spacing(16) }}>
            <View style={{ gap: spacing(4) }}>
              <Text style={styles.heroTitle}>More</Text>
            </View>
            <ProfileCard />
          </View>
        </ImageBackground>

        {/* Content card */}
        <View style={[styles.content, { backgroundColor: bg }]}>
          <View style={{ gap: spacing(12), paddingTop: spacing(26), paddingBottom: bottom + 40 }}>
            {MoreSection.map((section, index) => {
              const Icon = section.icon;
              return (
                <Pressable
                  key={index}
                  style={[
                    styles.section,
                    {
                      backgroundColor: sectionBg,
                      borderWidth: 1,
                      borderColor: sectionBorder,
                    },
                  ]}
                  onPress={section.onPress}
                >
                  <View style={styles.startRow}>
                    <LinearGradient
                      colors={["rgba(13, 107, 98, 1)", "rgba(22, 152, 141, 1)"]}
                      style={styles.iconWrapper}
                    >
                      <Icon size={scale(20)} color={"white"} />
                    </LinearGradient>
                    <View style={styles.col}>
                      <Text style={[Styles.reg14, { color: textColor }]}>{section.title}</Text>
                      <Text style={[Styles.reg12, { color: subColor }]}>{section.details}</Text>
                    </View>
                  </View>
                  <ChevronRight size={scale(16)} color={"rgba(153, 161, 175, 1)"} />
                </Pressable>
              );
            })}

            {/* Delete Account */}
            <Pressable
              style={[styles.section, styles.deleteSection, { borderColor: isDark ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.15)", backgroundColor: isDark ? "rgba(239,68,68,0.06)" : "rgba(255,245,245,1)" }]}
              onPress={handleDeleteAccount}
              disabled={deletingAccount}
            >
              <View style={styles.startRow}>
                <View style={[styles.iconWrapper, { backgroundColor: "rgba(239,68,68,0.12)" }]}>
                  <Trash2 size={scale(20)} color={"#ef4444"} />
                </View>
                <View style={styles.col}>
                  <Text style={[Styles.reg14, { color: "#ef4444" }]}>
                    {deletingAccount ? "Deleting…" : "Delete Account"}
                  </Text>
                  <Text style={[Styles.reg12, { color: isDark ? "rgba(239,68,68,0.6)" : "rgba(185,28,28,0.7)" }]}>
                    Permanently remove your account
                  </Text>
                </View>
              </View>
              <ChevronRight size={scale(16)} color={"rgba(239,68,68,0.5)"} />
            </Pressable>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Fixed overlay header background — transparent → black */}
      <Animated.View
        style={[
          styles.overlayHeader,
          { height: HEADER_HEIGHT, backgroundColor: headerSolidColor, opacity: headerBgOpacity },
        ]}
        pointerEvents="none"
      />

      {/* Fixed header icons + fading title */}
      <View
        style={[styles.overlayHeader, { height: HEADER_HEIGHT, paddingTop: top }]}
        pointerEvents="box-none"
      >
        <View style={styles.headerRow}>
          <HapticTab hitSlop={20} onPress={() => (navigation as any).toggleDrawer()}>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: whiteIconOpacity }]}>
              <Menu size={scale(24)} color="white" />
            </Animated.View>
            <Animated.View style={{ opacity: themeIconOpacity }}>
              <Menu size={scale(24)} color={themeIconColor} />
            </Animated.View>
          </HapticTab>

          <Animated.Text style={[styles.headerTitle, { opacity: titleOpacity, color: headerIconColor }]}>
            More
          </Animated.Text>

          <View style={{ width: scale(24) }} />
        </View>
      </View>
    </View>
  );
};

export default MoreScreen;

const styles = StyleSheet.create({
  heroBg: {
    backgroundColor: Colors.primary,
    paddingBottom: spacing(24),
  },
  heroTitle: {
    fontFamily: "semibold",
    fontSize: scaleFontSize(28),
    lineHeight: 34,
    color: "white",
  },
  overlayHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    justifyContent: "flex-end",
    paddingBottom: spacing(10),
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: "semibold",
    fontSize: scaleFontSize(18),
    color: "white",
  },
  content: {
    flex: 1,
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
    paddingHorizontal: spacing(16),
    marginTop: spacing(-40),
  },
  startRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing(16),
  },
  box: {
    padding: spacing(24),
    gap: spacing(16),
  },
  placeHolder: {
    backgroundColor: "white",
    width: 60,
    aspectRatio: 1,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  med24: {
    fontFamily: "medium",
    fontSize: scaleFontSize(20),
    color: Colors.primary,
    flexShrink: 1,
  },
  col: {
    gap: spacing(4),
    flex: 1,
  },
  section: {
    gap: spacing(16),
    padding: spacing(16),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 16,
  },
  deleteSection: {
    borderWidth: 1,
  },
  iconWrapper: {
    width: 48,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
});
