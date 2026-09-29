import BurgerIcon from "@/src/components/drawer/BurgerIcon";
import OrderItem from "@/src/components/orders/OrderItem";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useOrderStore } from "@/src/stores/orderSlice";
import { useUserStore } from "@/src/stores/userSlice";
import { Order } from "@/src/types/Order";
import { scale, scaleFontSize, spacing } from "@/src/utils/random";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Plus, Search } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OrdersScreen = () => {
  const { bottom, top } = useSafeAreaInsets();
  const { isDark } = useTheme();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const searchBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(249, 250, 251, 1)";
  const searchBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(229, 231, 235, 1)";
  const searchIconColor = isDark ? "rgba(120,120,120,1)" : "rgba(153, 161, 175, 1)";
  const placeholderColor = isDark ? "rgba(120,120,120,1)" : Colors.grey;

  const [searchValue, setSearchValue] = useState("");

  const user = useUserStore((state) => state.user);
  const loading = useOrderStore((state) => state.loading);
  const orders = useOrderStore((state) => state.orders);
  const fetchOrders = useOrderStore((state) => state.getOrdersByTailor);

  useEffect(() => {
    if (user) fetchOrders("");
  }, [user]);

  const filteredListData = useMemo(() => {
    const base = searchValue.trim()
      ? orders.filter((c: Order) => {
          const q = searchValue.toLowerCase();
          return (
            String(c?.name ?? "").toLowerCase().includes(q) ||
            String(c?.garmentDescription ?? "").toLowerCase().includes(q) ||
            String(c?.garmentType ?? "").toLowerCase().includes(q) ||
            String(c?.clientName ?? "").toLowerCase().includes(q)
          );
        })
      : orders;
    // Sort newest first by createdAt — same as the backend (sort createdAt: -1)
    return [...base].sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (isNaN(tA) && isNaN(tB)) return 0;
      if (isNaN(tA)) return 1;   // push bad dates to the bottom
      if (isNaN(tB)) return -1;
      return tB - tA;            // newest first
    });
  }, [searchValue, orders]);

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: top }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* header */}
      <View style={[styles.headerArea, { backgroundColor: bg }]}>
        <BurgerIcon
          title="Orders"
          iconColor={isDark ? "white" : undefined}
          textStyle={{
            fontFamily: "medium",
            fontSize: scaleFontSize(24),
            lineHeight: 30,
            color: textColor,
          }}
          viewStyle={{}}
        />

        <View style={[styles.searchContainer, { backgroundColor: searchBg, borderColor: searchBorder }]}>
          <Search size={scale(16)} color={searchIconColor} strokeWidth={2} />
          <TextInput
            value={searchValue}
            onChangeText={setSearchValue}
            placeholder="Search orders..."
            placeholderTextColor={placeholderColor}
            style={[styles.input, { color: textColor }]}
          />
        </View>
      </View>

      <FlatList
        data={filteredListData}
        keyExtractor={(item, index) => item.id + index.toString()}
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          gap: spacing(16),
          paddingHorizontal: spacing(16),
          paddingTop: spacing(16),
          paddingBottom: bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => fetchOrders("")}
            tintColor={Colors.primary}
          />
        }
        renderItem={({ item }) => <OrderItem order={item} />}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text style={[Styles.med12, { color: isDark ? "rgba(160,160,160,1)" : Colors.text.gray }]}>
              {loading ? "" : "No Order found."}
            </Text>
          </View>
        )}
      />

      <Pressable
        style={[styles.floatingBtn, { bottom: bottom + 20 }]}
        onPress={() => router.push("/protected/form/create-order")}
      >
        <Plus size={scale(20)} color="white" />
      </Pressable>
    </View>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    paddingHorizontal: spacing(16),
    paddingTop: spacing(12),
    paddingBottom: spacing(4),
    gap: spacing(12),
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(10),
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing(0),
    paddingHorizontal: spacing(14),
  },
  input: {
    flex: 1,
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: spacing(60),
  },
  floatingBtn: {
    width: 48,
    aspectRatio: 1,
    borderRadius: 100,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 16,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
