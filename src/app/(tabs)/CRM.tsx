import GlassCard from "@/src/components/dashboard/boxes/GlassBox";
import FeedbackItem from "@/src/components/feedback/Item";
import { HapticTab } from "@/src/components/haptic-tab";
import CrmItem from "@/src/components/member/Item";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useCrmStore } from "@/src/stores/crmSlice";
import {
  ClientFeedback,
  getAverageRating,
  LoyaltyMember,
} from "@/src/types/crm";
import { scale, scaleFontSize, spacing } from "@/src/utils/random";
import { router, useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Gift,
  Mail,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Star,
  UsersIcon,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  ImageBackground,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HORIZONTAL_PADDING = 16;
const CARD_GAP = spacing(8);
const HEADER_SCROLL_DISTANCE = 100;

// ─── Summary boxes ──────────────────────────────────────────────────────────
const RowBoxes = () => {
  const members = useCrmStore((state) => state.loyaltyMembers);
  const clientFeedbacks = useCrmStore((state) => state.clientFeedbacks);

  return (
    <View style={styles.row}>
      <GlassCard style={styles.box}>
        <View style={styles.cardInner}>
          <View style={styles.startRow}>
            <UsersIcon size={scale(13)} color={"white"} />
            <Text style={[Styles.med12, { color: "white", lineHeight: 16 }]}>Members</Text>
          </View>
          <Text style={styles.sm18}>{members.length}</Text>
        </View>
      </GlassCard>

      <GlassCard style={styles.box}>
        <View style={styles.cardInner}>
          <View style={styles.startRow}>
            <Star size={scale(13)} color={"white"} />
            <Text style={[Styles.med12, { color: "white", lineHeight: 16 }]}>Rating</Text>
          </View>
          <Text style={styles.sm18}>{getAverageRating(clientFeedbacks)}</Text>
        </View>
      </GlassCard>

      <GlassCard style={styles.box}>
        <View style={styles.cardInner}>
          <View style={styles.startRow}>
            <Mail size={scale(13)} color={"white"} />
            <Text style={[Styles.med12, { color: "white", lineHeight: 16 }]}>Reviews</Text>
          </View>
          <Text style={styles.sm18}>{clientFeedbacks.length}</Text>
        </View>
      </GlassCard>
    </View>
  );
};

type TAB = "loyalty" | "feedback";

const TabsList = [
  { label: "Loyalty", icon: Gift, value: "loyalty" },
  { label: "Feedback", icon: MessageSquare, value: "feedback" },
];

// ─── Main screen ─────────────────────────────────────────────────────────────
const CRMScreen = () => {
  const [selectedTab, setSelectedTab] = useState<TAB>("loyalty");
  const { isDark } = useTheme();
  const { top, bottom } = useSafeAreaInsets();
  const navigation = useNavigation();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const searchBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(249, 250, 251, 1)";
  const headerSolidColor = isDark ? "#0f0f0f" : "white";
  const themeIconColor = isDark ? Colors.text.white : Colors.text.black;
  const searchBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(229, 231, 235, 1)";
  const searchIconColor = isDark ? "rgba(120,120,120,1)" : "rgba(153, 161, 175, 1)";
  const placeholderColor = isDark ? "rgba(120,120,120,1)" : Colors.grey;
  const tabInactiveText = isDark ? "rgba(160,160,160,1)" : Colors.grey;

  const loading = useCrmStore((state) => state.loading);
  const getLoyaltyMembers = useCrmStore((state) => state.getLoyaltyMembers);
  const getFeedBacks = useCrmStore((state) => state.getFeedBacks);
  const members = useCrmStore((state) => state.loyaltyMembers);
  const clientFeedbacks = useCrmStore((state) => state.clientFeedbacks);

  const [searchValue, setSearchValue] = useState("");

  const filteredListData = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (selectedTab === "loyalty") {
      const base = members.filter(
        (m: LoyaltyMember) =>
          q === "" ||
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.email && m.email.toLowerCase().includes(q)),
      );
      return [...base].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }
    if (selectedTab === "feedback") {
      const base = clientFeedbacks.filter(
        (c: ClientFeedback) =>
          q === "" ||
          (c.productName && c.productName.toLowerCase().includes(q)) ||
          (c.clientName && c.clientName.toLowerCase().includes(q)),
      );
      return [...base].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }
    return [];
  }, [selectedTab, searchValue, members, clientFeedbacks]);

  const fetchData = useCallback(async () => {
    try {
      await Promise.all([getLoyaltyMembers(), getFeedBacks()]);
    } catch (error) {
      console.error("error fetching crm data", error);
    }
  }, [getFeedBacks, getLoyaltyMembers]);

  useEffect(() => {
    fetchData();
  }, []);

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

      {/* ── Single scrollable layer — bg image scrolls with content ── */}
      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchData}
            tintColor={Colors.primary}
            progressViewOffset={HEADER_HEIGHT}
          />
        }
      >
        {/* Background image hero — scrolls away with the page */}
        <ImageBackground
          source={require("@/assets/images/screen_bg.png")}
          style={[styles.heroBg, { paddingTop: top + spacing(56) }]}
        >
          <View style={{ paddingHorizontal: 16, paddingBottom: spacing(24), gap: spacing(16) }}>
            <View style={{ gap: spacing(4) }}>
              <Text style={styles.heroTitle}>CRM</Text>
              <Text style={[Styles.reg14, { color: "rgba(255,255,255,0.8)", lineHeight: 18 }]}>
                Manage Your Customer Relationship
              </Text>
            </View>
            <RowBoxes />
          </View>
        </ImageBackground>

        {/* Content card */}
        <View style={[styles.content, { backgroundColor: bg }]}>
          <View style={{ gap: spacing(15), paddingVertical: spacing(26), paddingBottom: bottom + 100 }}>

            {/* Tabs */}
            <View style={[styles.tabs, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(249,250,251,1)", borderRadius: 16, padding: spacing(4) }]}>
              {TabsList.map((tab, index) => {
                const Icon = tab.icon;
                const isSelected = selectedTab === tab.value;
                return (
                  <Pressable
                    key={index}
                    style={isSelected ? [styles.tabBtn, styles.selectedTab] : [styles.tabBtn, { backgroundColor: "transparent" }]}
                    onPress={() => setSelectedTab(tab.value as TAB)}
                  >
                    <Icon size={scale(15)} color={isSelected ? "white" : tabInactiveText} />
                    <Text style={isSelected ? [Styles.reg14, styles.selectedText] : [Styles.reg14, { color: tabInactiveText }]}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Search */}
            <View
              style={[
                styles.searchContainer,
                styles.startRow,
                { gap: spacing(12), backgroundColor: searchBg, borderColor: searchBorder },
              ]}
            >
              <Search size={scale(20)} color={searchIconColor} strokeWidth={2} />
              <TextInput
                value={searchValue}
                onChangeText={setSearchValue}
                placeholder={`Search ${selectedTab}...`}
                placeholderTextColor={placeholderColor}
                style={[styles.input, { color: textColor }]}
              />
            </View>

            {/* Count + list */}
            <View style={{ gap: spacing(24) }}>
              <Text style={[Styles.reg16, { color: textColor }]}>
                {selectedTab === "feedback"
                  ? `${clientFeedbacks.length} Reviews`
                  : `${members.length} Loyalty Members`}
              </Text>

              {loading ? (
                <ActivityIndicator size={"small"} color={Colors.primary} />
              ) : (
                <FlatList
                  data={filteredListData as any}
                  keyExtractor={(item: any) => item.id}
                  style={{ flex: 1 }}
                  contentContainerStyle={{ flexGrow: 1, gap: spacing(16), paddingBottom: spacing(40) }}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                  renderItem={({ item }: { item: any }) =>
                    selectedTab === "loyalty"
                      ? <CrmItem item={item} />
                      : <FeedbackItem item={item} />
                  }
                  ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                      <Text style={[Styles.med12, { color: isDark ? "rgba(160,160,160,1)" : Colors.text.gray }]}>
                        {`No ${selectedTab} found.`}
                      </Text>
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* ── Fixed overlay header background (transparent → black) ── */}
      <Animated.View
        style={[
          styles.overlayHeader,
          { height: HEADER_HEIGHT, backgroundColor: headerSolidColor, opacity: headerBgOpacity },
        ]}
        pointerEvents="none"
      />

      {/* ── Fixed header icons + fading title ── */}
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
            CRM
          </Animated.Text>

          <View style={{ width: scale(24) }} />
        </View>
      </View>

      {/* ── Floating action button ── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: bottom + spacing(24) }]}
        onPress={() => {
          if (selectedTab === "loyalty") {
            router.push("/protected/form/create-memeber");
          } else {
            router.push("/protected/form/create-feedback");
          }
        }}
        activeOpacity={0.85}
      >
        <Plus size={scale(24)} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default CRMScreen;

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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: CARD_GAP,
  },
  box: {
    flex: 1,
    height: 100,
  },
  cardInner: {
    flex: 1,
    padding: spacing(12),
    justifyContent: "space-between",
  },
  startRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing(4),
  },
  sm18: {
    fontFamily: "semibold",
    fontSize: scaleFontSize(20),
    lineHeight: 28,
    color: "white",
    textAlign: "center",
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
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
    paddingHorizontal: spacing(16),
     height:'100%',
       marginTop: spacing(-40),
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing(7),
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing(8),
  },
  selectedTab: {
    backgroundColor: Colors.primary,
  },
  selectedText: {
    color: "white",
  },
  searchContainer: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: spacing(7),
    paddingHorizontal: spacing(16),
  },
  input: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    right: spacing(20),
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
