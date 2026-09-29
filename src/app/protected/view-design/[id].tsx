import { HapticTab } from "@/src/components/haptic-tab";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useDesignStore } from "@/src/stores/designSlice";
import { FormatCurrency, scale, scaleFontSize, spacing } from "@/src/utils/random";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const ViewDesignItemScreen = () => {
  const { id } = useLocalSearchParams();
  const { isDark } = useTheme();
  const { top } = useSafeAreaInsets();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : "rgba(10, 10, 10, 1)";
  const subTextColor = isDark ? "rgba(160,160,160,1)" : "rgba(106, 114, 130, 1)";
  const labelColor = isDark ? "rgba(180,180,180,1)" : "rgba(74, 85, 101, 1)";
  const noteBoxBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(254, 252, 232, 1)";
  const noteBoxText = isDark ? "rgba(200,200,200,1)" : "rgba(74, 85, 101, 1)";
  const badgeBg = isDark ? "rgba(255,140,0,0.15)" : "rgba(255, 237, 212, 1)";
  const badgeText = isDark ? "rgba(255,160,60,1)" : "rgba(202, 53, 0, 1)";
  const chevronColor = isDark ? "rgba(200,200,200,1)" : "rgba(54, 65, 83, 1)";
  const headerTitleColor = isDark ? Colors.text.white : "rgba(54, 65, 83, 1)";
  const recImgBorder = isDark ? "rgba(22,152,141,0.5)" : "rgba(22, 152, 141, 1)";
  const deleteBtnBg = isDark ? "rgba(231,0,11,0.15)" : "rgba(254, 242, 242, 1)";

  const loading = useDesignStore((state) => state.loading);
  const designs = useDesignStore((state) => state.designs);
  const deleteDesign = useDesignStore((state) => state.deleteDesign);
  const foundDesign = designs.find((prev) => prev.id === id.toString());

  const handleDeleteDesign = async () => {
    if (!foundDesign) return;
    try {
      await deleteDesign(foundDesign.id);
      router.back();
    } catch (err) {
      console.error("Error deleting design", err);
    }
  };

  const handleBack = () => router.replace("/(tabs)/Designs");

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: top }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* header */}
      <View style={styles.header}>
        <HapticTab
          style={styles.backBtn}
          hitSlop={20}
          onPress={handleBack}
        >
          <ChevronLeft size={scale(20)} color={chevronColor} strokeWidth={1.5} />
        </HapticTab>
        <Text style={[styles.reg16, { color: headerTitleColor, flex: 1, textAlign: "center" }]}>
          Design Details
        </Text>
        {/* spacer to keep title centered */}
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: spacing(20),
          paddingBottom: spacing(40),
        }}
        keyboardDismissMode="interactive"
      >
        <View style={styles.content}>
          {/* image */}
          {foundDesign?.imageUrl?.trim() ? (
            <View style={{ gap: spacing(12) }}>
              <Image source={{ uri: foundDesign.imageUrl }} style={styles.designImg} />
              <Image
                source={{ uri: foundDesign.imageUrl }}
                style={[styles.recImg, { borderColor: recImgBorder }]}
              />
            </View>
          ) : (
            <View style={{ paddingVertical: spacing(30) }}>
              <Text style={[styles.reg24, { textAlign: "center", color: subTextColor }]}>
                No Image
              </Text>
            </View>
          )}

          {/* name + badge */}
          <View style={[styles.col, { gap: spacing(8) }]}>
            <Text style={[styles.reg24, { color: textColor }]}>{foundDesign?.name}</Text>
            <View style={[styles.badge, { backgroundColor: badgeBg }]}>
              <Text style={[styles.reg12, { color: badgeText }]}>Available</Text>
            </View>
          </View>

          {/* price */}
          <View style={styles.col}>
            <Text style={[styles.reg12, { color: subTextColor }]}>Starting Price</Text>
            <Text style={[styles.reg14, { color: textColor }]}>
              {FormatCurrency(foundDesign?.price ?? 0)}
            </Text>
          </View>

          {/* notes */}
          <View style={[styles.col, { gap: spacing(12) }]}>
            <Text style={[styles.reg14, { color: labelColor }]}>Notes</Text>
            <View style={[styles.notebox, { backgroundColor: noteBoxBg }]}>
              <Text style={[styles.reg14, { color: noteBoxText }]}>
                {foundDesign?.notes?.trim() ? foundDesign.notes : "No notes"}
              </Text>
            </View>
          </View>

          {/* action buttons */}
          <View style={[styles.row, { flex: 1, gap: spacing(80), alignItems: "flex-end" }]}>
            <HapticTab
              style={styles.primaryBtn}
              onPress={() =>
                router.push({
                  pathname: "/protected/design/[id]",
                  params: { id: foundDesign?.id ?? "" },
                })
              }
            >
              <Pencil size={scale(18)} color="white" />
              <Text style={styles.btnText}>Edit Design</Text>
            </HapticTab>

            <Pressable
              style={[styles.deleteBtn, { backgroundColor: deleteBtnBg }]}
              onPress={handleDeleteDesign}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="rgba(231, 0, 11, 1)" />
              ) : (
                <Trash2 size={scale(15)} color="rgba(231, 0, 11, 1)" />
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ViewDesignItemScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing(16),
    paddingTop: spacing(12),
    paddingBottom: spacing(8),
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
  reg12: {
    fontFamily: "regular",
    fontSize: scaleFontSize(12),
  },
  reg14: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
  },
  reg16: {
    fontFamily: "regular",
    fontSize: scaleFontSize(16),
  },
  reg24: {
    fontFamily: "regular",
    fontSize: scaleFontSize(24),
    lineHeight: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    gap: spacing(20),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  designImg: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.4,
    borderRadius: 16,
  },
  recImg: {
    width: 80,
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
  },
  badge: {
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(6),
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  notebox: {
    padding: spacing(12),
    borderRadius: 14,
  },
  primaryBtn: {
    flex: 1,
    height: 56,
    backgroundColor: "rgba(22, 152, 141, 1)",
    gap: spacing(8),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  deleteBtn: {
    width: 66,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  btnText: {
    fontFamily: "regular",
    fontSize: scaleFontSize(16),
    color: "white",
    lineHeight: 24,
  },
});
