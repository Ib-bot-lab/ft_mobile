import DesignItem from "@/src/components/designs/DesignItem";
import BurgerIcon from "@/src/components/drawer/BurgerIcon";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useDesignStore } from "@/src/stores/designSlice";
import { useUserStore } from "@/src/stores/userSlice";
import { Design } from "@/src/types/designs";
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

const DesignsScreen = () => {
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
  const loading = useDesignStore((state) => state.loading);
  const designs = useDesignStore((state) => state.designs);
  const fetchDesigns = useDesignStore((state) => state.getDesignsByTailor);

  useEffect(() => {
    if (user) fetchDesigns("");
  }, [user]);

  const filteredListData = useMemo(() => {
    const base = searchValue.trim()
      ? designs.filter((c: Design) =>
          String(c?.name ?? "").toLowerCase().includes(searchValue.toLowerCase()),
        )
      : designs;
    return [...base].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [searchValue, designs]);

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: top }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* header */}
      <View style={[styles.headerArea, { backgroundColor: bg }]}>
        <BurgerIcon
          title="Designs"
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
            placeholder="Search designs..."
            placeholderTextColor={placeholderColor}
            style={[styles.input, { color: textColor }]}
          />
        </View>
      </View>

      {/* list */}
      <FlatList
        data={filteredListData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          flexGrow: 1,
          gap: spacing(16),
          paddingHorizontal: spacing(16),
          paddingTop: spacing(16),
          paddingBottom: bottom + 80,
        }}
        columnWrapperStyle={{ gap: spacing(16) }}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => fetchDesigns("")}
            tintColor={Colors.primary}
          />
        }
        renderItem={({ item }) => (
          <DesignItem item={item} style={{ width: undefined, flex: 1 }} />
        )}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text style={[Styles.med12, { color: isDark ? "rgba(160,160,160,1)" : Colors.text.gray }]}>
              {loading ? "" : "No design found."}
            </Text>
          </View>
        )}
      />

      <Pressable
        style={[styles.floatingBtn, { bottom: bottom + 20 }]}
        onPress={() => router.push("/protected/form/create-design")}
      >
        <Plus size={scale(20)} color="white" />
      </Pressable>
    </View>
  );
};

export default DesignsScreen;

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
