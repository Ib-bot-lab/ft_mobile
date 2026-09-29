import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/hooks/auth";
import { useUserImage } from "@/src/hooks/useUserImage";
import { DrawerItem, useDrawerStore } from "@/src/stores/navigation/drawerSlice";
import { useUserStore } from "@/src/stores/userSlice";
import { scale, scaleFontSize, spacing } from "@/src/utils/random";
import { LegendList, LegendListRef, LegendListRenderItemProps } from "@legendapp/list";
import { Href, useRouter } from "expo-router";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { LogOut, Headphones } from "lucide-react-native";
import { PressableScale, PressablesGroup } from "pressto";
import { useCallback, useMemo, useRef } from "react";
import { ActivityIndicator, Alert, Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "../haptic-tab";
import ImagePlaceholder from "../shared/ImagePlaceholder";
import { DrawerListItem } from "./drawer-list-item";

const keyExtractor = (item: DrawerItem) => item?.id || "";
const LIST_ITEM_HEIGHT = 56;
export const DrawerContentWidth = Dimensions.get("window").width * 0.35;

export function DrawerContent(props: DrawerContentComponentProps) {
  const { signOut, loading } = useAuth();
  const { isDark } = useTheme();
  const brandSetting = useUserStore((state) => state.brandSetting);
  const { getImageUri } = useUserImage();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const name = user?.businessName ?? brandSetting?.businessName?.trim() ?? user?.name ?? "Unknown";
  const { top, bottom } = useSafeAreaInsets();
  const drawerItems = useDrawerStore((state) => state.items);
  const listRef = useRef<LegendListRef>(null);

  const bg = isDark ? "#0f0f0f" : "#ffffff";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(22,152,141,0.2)";
  const textColor = isDark ? Colors.text.white : Colors.primaryDark;
  const subTextColor = isDark ? "rgba(180,180,180,1)" : Colors.label;
  const logoutBg = isDark ? "rgba(255,60,60,0.08)" : "rgba(255,60,60,0.06)";

  const closeDrawer = useCallback(() => {
    props.navigation.closeDrawer();
  }, [props.navigation]);

  const renderItem = useCallback(
    ({ item }: LegendListRenderItemProps<DrawerItem>) => (
      <DrawerListItem
        item={item}
        isDark={isDark}
        style={styles.listItem}
        onPress={() => {
          router.push(item.route as Href);
          closeDrawer();
        }}
      />
    ),
    [router, isDark],
  );

  const scrollComponent = useCallback((props: any) => <ScrollView {...props} />, []);

  const estimatedListSize = useMemo(() => ({
    height: LIST_ITEM_HEIGHT * drawerItems.length,
    width: DrawerContentWidth,
  }), [drawerItems.length]);

  return (
    <View style={[styles.container, { paddingTop: top, backgroundColor: bg }]}>
      {/* Logo + App name */}
      <PressableScale
        onPress={() => router.push("/(tabs)/Dashboard")}
        style={[styles.logoRow, { marginTop: spacing(8) }]}
      >
        <Image source={require("@/assets/images/fashion_tally_logo.png")} style={styles.appIcon} />
        <Text style={[styles.appName, { color: textColor }]}>FashionTally</Text>
      </PressableScale>

      {/* User/brand card */}
      <View style={[styles.userCard, { borderColor, backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(22,152,141,0.05)" }]}>
        {brandSetting?.logoUrl ? (
          <Image source={{ uri: getImageUri(brandSetting.logoUrl) }} style={styles.avatar} />
        ) : (
          <ImagePlaceholder name={name} size={44} fontSize={16} />
        )}
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: textColor }]} numberOfLines={1}>{name}</Text>
          <Text style={[styles.userRole, { color: subTextColor }]} numberOfLines={1}>
            {user?.role ?? "Designer"}
          </Text>
        </View>
      </View>

      {/* Nav items */}
      <View style={[styles.divider, { backgroundColor: borderColor }]} />

      <View style={styles.listContainer}>
        <PressablesGroup>
          <LegendList
            recycleItems={false}
            waitForInitialLayout
            ref={listRef}
            renderItem={renderItem}
            data={drawerItems}
            estimatedListSize={estimatedListSize}
            keyExtractor={keyExtractor}
            keyboardDismissMode="on-drag"
            estimatedItemSize={LIST_ITEM_HEIGHT}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[styles.contentContainer, { paddingBottom: bottom }]}
            renderScrollComponent={scrollComponent}
            showsVerticalScrollIndicator={false}
          />
        </PressablesGroup>
      </View>

      {/* Divider + Bottom actions */}
      <View style={[styles.divider, { backgroundColor: borderColor }]} />

      <View style={[styles.bottomRow, { marginBottom: bottom + 16 }]}>
        {/* Ticketing / Support button — icon + text */}
        <HapticTab
          style={[styles.ticketBtn, { backgroundColor: isDark ? "rgba(22,152,141,0.1)" : "rgba(22,152,141,0.08)", flex: 1 }]}
          hitSlop={10}
          onPress={() => {
            props.navigation.closeDrawer();
            router.push("/protected/ticketing" as Href);
          }}
        >
          <Headphones size={scale(16)} color={Colors.primary} />
          <Text style={[styles.ticketText, { color: Colors.primary }]}>Support</Text>
        </HapticTab>

        {/* Logout — icon only with confirm alert */}
        <HapticTab
          style={[styles.logOutIconBtn, { backgroundColor: logoutBg }]}
          hitSlop={20}
          onPress={() => {
            Alert.alert(
              "Log Out",
              "Are you sure you want to log out?",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Log Out", style: "destructive", onPress: signOut },
              ],
            );
          }}
        >
          {loading ? (
            <ActivityIndicator size={scale(15)} color={"#ef4444"} />
          ) : (
            <LogOut size={scale(16)} color={"#ef4444"} />
          )}
        </HapticTab>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing(16),
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(6),
    marginBottom: spacing(20),
  },
  appIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  appName: {
    fontFamily: "medium",
    fontSize: scaleFontSize(20),
    letterSpacing: -0.5,
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userInfo: {
    flex: 1,
    gap: spacing(2),
  },
  userName: {
    fontFamily: "medium",
    fontSize: scaleFontSize(14),
  },
  userRole: {
    fontFamily: "regular",
    fontSize: scaleFontSize(12),
  },
  divider: {
    height: 1,
    borderRadius: 1,
    marginVertical: spacing(8),
    marginHorizontal: spacing(0),
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    height: LIST_ITEM_HEIGHT,
    paddingHorizontal: spacing(12),
  },
  contentContainer: {
    gap: spacing(4),
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(8),
  },
  ticketBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(8),
    paddingHorizontal: spacing(14),
    paddingVertical: spacing(12),
    borderRadius: 12,
  },
  ticketText: {
    fontFamily: "medium",
    fontSize: scaleFontSize(13),
  },
  logOutIconBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: scale(42),
    height: scale(42),
    borderRadius: 12,
    flexShrink: 0,
  },
});
