import ClientItem from "@/src/components/clients/Item";
import BurgerIcon from "@/src/components/drawer/BurgerIcon";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useClientStore } from "@/src/stores/clientSlice";
import { useUserStore } from "@/src/stores/userSlice";
import { scale, scaleFontSize, spacing } from "@/src/utils/random";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Plus, Search } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ClientsScreen = () => {
  const [searchValue, setSearchValue] = useState("");
  const { isDark } = useTheme();
  const { top, bottom } = useSafeAreaInsets();

  const user = useUserStore((state) => state.user);
  const loading = useClientStore((state) => state.loading);
  const clients = useClientStore((state) => state.clients);
  const fetchClients = useClientStore((state) => state.getClientsByTailor);

  useEffect(() => {
    if (user) fetchClients("");
  }, [user]);

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const searchBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(249, 250, 251, 1)";
  const searchBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(229, 231, 235, 1)";
  const placeholderColor = isDark ? "rgba(120,120,120,1)" : Colors.grey;

  const filteredListData = useMemo(() => {
    const base = searchValue.trim()
      ? clients.filter((c: any) => {
          const q = searchValue.toLowerCase();
          return (
            String(c?.name ?? "").toLowerCase().includes(q) ||
            String(c?.phone ?? "").toLowerCase().includes(q) ||
            String(c?.email ?? "").toLowerCase().includes(q)
          );
        })
      : clients;

    // Sort by date added — newest first
    return [...base].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [searchValue, clients]);

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: top }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* sticky header */}
      <View style={[styles.header, { backgroundColor: bg }]}>
        <BurgerIcon
          title="Clients"
          iconColor={isDark ? "white" : undefined}
          textStyle={{ fontFamily: "medium", fontSize: scaleFontSize(24), color: textColor }}
          viewStyle={{}}
        />

        <View style={[styles.searchBar, { backgroundColor: searchBg, borderColor: searchBorder }]}>
          <Search size={scale(16)} color={placeholderColor} strokeWidth={2} />
          <TextInput
            value={searchValue}
            onChangeText={setSearchValue}
            placeholder="Search by name, phone or email"
            placeholderTextColor={placeholderColor}
            style={[styles.searchInput, { color: textColor }]}
          />
        </View>
      </View>

      {/* list scrolls behind header */}
      <FlatList
        data={filteredListData}
        keyExtractor={(item, index) => item.id + index.toString()}
        contentContainerStyle={{
          gap: spacing(12),
          paddingHorizontal: spacing(16),
          paddingTop: spacing(10),
          paddingBottom: bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <ClientItem item={item} />}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => fetchClients("")}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={[Styles.med12, { color: isDark ? "rgba(160,160,160,1)" : Colors.text.gray }]}>
                No client found.
              </Text>
            )}
          </View>
        )}
      />

      <Pressable
        style={[styles.floatingBtn, { bottom: bottom + 20 }]}
        onPress={() => router.push("/protected/form/create-client")}
      >
        <Plus size={scale(20)} color="white" />
      </Pressable>
    </View>
  );
};

export default ClientsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing(16),
    paddingTop: spacing(12),
    paddingBottom: spacing(-3),
    gap: spacing(12),
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(10),
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing(0),
    paddingHorizontal: spacing(14),
    zIndex: 20,
  },
  searchInput: {
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
