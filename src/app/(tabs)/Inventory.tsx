import GlassCard from "@/src/components/dashboard/boxes/GlassBox";
import { HapticTab } from "@/src/components/haptic-tab";
import CategoryList from "@/src/components/inventory/CategoryList";
import StockItem from "@/src/components/inventory/Item";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useInventoryStore } from "@/src/stores/inventorySlice";
import { useUserStore } from "@/src/stores/userSlice";
import { GetTotalInventoryValue } from "@/src/types/inventory";
import {
  FormatNairaShorthand,
  scale,
  scaleFontSize,
  spacing,
} from "@/src/utils/random";
import { router, useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  BanknoteArrowUp,
  Menu,
  Plus,
  Search,
  TrendingDown,
  TriangleAlert,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ImageBackground,
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
  const stocks = useInventoryStore((state) => state.stocks);
  const lowStock = stocks.filter((s) => s.status === "low-stock").length;
  const outOfStock = stocks.filter((s) => s.status === "out-of-stock").length;
  const inventoryValue = GetTotalInventoryValue(stocks);

  return (
    <View style={styles.row}>
      <GlassCard style={styles.box}>
        <View style={[styles.cardInner]}>
          <View style={styles.startRow}>
            <BanknoteArrowUp size={scale(13)} color={"white"} />
            <Text style={[Styles.med12, { color: "white", lineHeight: 16 }]}>Stock Value</Text>
          </View>
          <Text style={styles.sm18} numberOfLines={1} adjustsFontSizeToFit>
            {FormatNairaShorthand(inventoryValue.toString())}
          </Text>
        </View>
      </GlassCard>

      <GlassCard style={styles.box}>
        <View style={styles.cardInner}>
          <View style={styles.startRow}>
            <TriangleAlert size={scale(13)} color={"white"} />
            <Text style={[Styles.med12, { color: "white", lineHeight: 16 }]}>Low Stock</Text>
          </View>
          <Text style={styles.sm18}>{lowStock}</Text>
        </View>
      </GlassCard>

      <GlassCard style={styles.box}>
        <View style={styles.cardInner}>
          <View style={styles.startRow}>
            <TrendingDown size={scale(13)} color={"white"} />
            <Text style={[Styles.med12, { color: "white", lineHeight: 16 }]}>Out of Stock</Text>
          </View>
          <Text style={styles.sm18}>{outOfStock}</Text>
        </View>
      </GlassCard>
    </View>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────
const InventoryScreen = () => {
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { isDark } = useTheme();
  const { top, bottom } = useSafeAreaInsets();
  const navigation = useNavigation();

  const bg = isDark ? "#0f0f0f" : "white";
  const searchBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(249, 250, 251, 1)";
  const headerSolidColor = isDark ? "#0f0f0f" : "white";
  const themeIconColor = isDark ? Colors.text.white : Colors.text.black;
  const searchBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(229, 231, 235, 1)";
  const searchIconColor = isDark ? "rgba(120,120,120,1)" : "rgba(153, 161, 175, 1)";
  const searchTextColor = isDark ? Colors.text.white : Colors.black;
  const countTextColor = isDark ? "rgba(200,200,200,1)" : "black";

  const user = useUserStore((state) => state.user);
  const loading = useInventoryStore((state) => state.loading);
  const stocks = useInventoryStore((state) => state.stocks);
  const fetchStocks = useInventoryStore((state) => state.getInventoryByTailor);

  const fetchData = useCallback(async () => {
    await fetchStocks("");
  }, [fetchStocks]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const filteredStocks = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    const base = stocks.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      if (!q) return matchesCategory;
      return matchesCategory && (item.name || "").toLowerCase().includes(q);
    });
    return [...base].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [stocks, searchValue, selectedCategory]);

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
          style={[styles.heroBg, { paddingTop: top + spacing(56), }]}
              resizeMode="cover"
        >
          <View
            style={{
              flex: 1,
              paddingHorizontal: 16,
              paddingBottom: spacing(24),
              gap: spacing(16),
            }}
          >
            <View style={{ gap: spacing(4) }}>
              <Text style={styles.heroTitle}>Inventory</Text>
              <Text style={[Styles.reg14, { color: "rgba(255,255,255,0.8)", lineHeight: 18 }]}>
                Manage your stock and supplies
              </Text>
            </View>
            <RowBoxes />
          </View>
        </ImageBackground>

        {/* White/dark card slides up over the bg image */}
        <View style={[styles.content, { backgroundColor: bg }]}>
          <View
            style={{
              gap: spacing(16),
              paddingVertical: spacing(26),
              paddingBottom: bottom + 100,
            }}
          >
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
                placeholder={"Search inventory..."}
                placeholderTextColor={isDark ? "rgba(120,120,120,1)" : Colors.grey}
                style={[styles.input, { color: searchTextColor }]}
              />
            </View>

            {/* Categories */}
            <View style={{ height: 48 }}>
              <CategoryList
                onSelect={(category) => setSelectedCategory(category)}
                selectedCategory={selectedCategory}
              />
            </View>

            {/* List header */}
            <Text style={[Styles.reg16, { color: countTextColor }]}>
              {stocks.length} Items
            </Text>

            {/* Items */}
            {loading && stocks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size={"small"} color={Colors.primary} />
              </View>
            ) : filteredStocks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[Styles.med12, { color: isDark ? "rgba(160,160,160,1)" : Colors.text.gray }]}>
                  No item found.
                </Text>
              </View>
            ) : (
              <View style={{ gap: spacing(16) }}>
                {filteredStocks.map((item) => (
                  <StockItem key={item.id} item={item} />
                ))}
              </View>
            )}
          </View>
        </View>
      </Animated.ScrollView>

      {/* ── Fixed overlay header background (transparent → theme color) ── */}
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
            Inventory
          </Animated.Text>

          <View style={{ width: scale(24) }} />
        </View>
      </View>

      {/* ── Floating action button ── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: bottom + spacing(24) }]}
        onPress={() => router.push("/protected/form/create-stock")}
        activeOpacity={0.85}
      >
        <Plus size={scale(24)} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default InventoryScreen;

const styles = StyleSheet.create({
  heroBg: {
    paddingBottom: spacing(0),
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
   marginBottom: 30,
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
    marginTop: -30
  },
  searchContainer: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(16),
  },
  input: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: spacing(40),
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
