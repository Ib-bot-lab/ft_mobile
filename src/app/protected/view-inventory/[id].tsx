import { HapticTab } from "@/src/components/haptic-tab";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useInventoryStore } from "@/src/stores/inventorySlice";
import {
  CapitalizeFirstName,
  FormatCurrency,
  formatFintechDate,
  FormatNairaShorthand,
  scale,
  scaleFontSize,
  spacing,
} from "@/src/utils/random";
import { router, useLocalSearchParams } from "expo-router";
import {
  Box,
  CheckCircle,
  ChevronLeft,
  CircleDollarSign,
  Clock,
  FileText,
  Info,
  Pencil,
  SwatchBook,
  Tag,
  Trash2,
  UserIcon,
} from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ViewInventoryItemScreen = () => {
  const { id } = useLocalSearchParams();

  const { isDark } = useTheme();
  const { top } = useSafeAreaInsets();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : "rgba(10, 10, 10, 1)";
  const subTextColor = isDark ? "rgba(160,160,160,1)" : "rgba(106, 114, 130, 1)";
  const sectionTitleColor = isDark ? "rgba(200,200,200,1)" : "rgba(54, 65, 83, 1)";
  const iconColor = isDark ? "rgba(180,180,180,1)" : "black";
  const boxBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(249, 250, 251, 1)";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(54, 65, 83, 1)";
  const recBoxBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(249, 250, 251, 1)";
  const chevronColor = isDark ? "rgba(200,200,200,1)" : "rgba(54, 65, 83, 1)";

  const loading = useInventoryStore((state) => state.loading);
  const deleteItem = useInventoryStore((state) => state.deleteInventoryItem);

  const stocks = useInventoryStore((state) => state.stocks);
  const foundInventory = stocks.find((prev) => prev.id === id.toString());

  const inStock = foundInventory?.status.toLowerCase().includes("in stock");

  const totalValue =
    (foundInventory?.quantity ?? 1) *
    (foundInventory?.sellingPricePerUnit ?? 0);

  const handleDelete = () => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: () => deleteItem(foundInventory?.id ?? "") },
      ],
      { cancelable: true },
    );
  };

  const handleBack = () => {
    router.replace("/(tabs)/Inventory");
  };
  return (
    <>
      <View style={[{ flex: 1, paddingTop: top, backgroundColor: bg }]}>
        <View style={styles.header}>
          <HapticTab
            style={{
              width: 32,
              aspectRatio: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={handleBack}
          >
            <ChevronLeft
              size={scale(20)}
              color={chevronColor}
              strokeWidth={1.5}
            />
          </HapticTab>

          <View style={styles.col}>
            <Text style={[styles.reg20, { color: textColor }]}>{foundInventory?.name}</Text>
            <Text style={[styles.reg14g, { color: subTextColor }]}>
              SKU: {foundInventory?.id.slice(0, 6)}
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: bg }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? spacing(50) : spacing(0)}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ flexGrow: 1, paddingVertical: spacing(30) }}
            keyboardDismissMode="interactive"
          >
            <View style={styles.content}>
              <View style={styles.sections}>
                <View style={styles.section}>
                  <View style={[styles.gapRow, { gap: spacing(8) }]}>
                    <Info size={scale(14)} color={iconColor} />
                    <Text style={[styles.reg14g, { color: sectionTitleColor }]}>
                      Item Details
                    </Text>
                  </View>

                  <View style={[styles.box, { backgroundColor: boxBg }]}>
                    <View style={[styles.gapRow, { gap: spacing(8) }]}>
                      <View style={[styles.gapRow, { gap: spacing(8) }]}>
                        <CheckCircle size={scale(12)} color={iconColor} />
                        <Text style={[styles.reg14g, { color: sectionTitleColor }]}>
                          Status
                        </Text>
                      </View>
                      <View style={[styles.badge, inStock && { backgroundColor: "rgba(220, 252, 231, 1)" }]}>
                        <Text style={[styles.reg14g, { color: inStock ? "rgba(0, 130, 54, 1)" : "rgba(231, 0, 11, 1)" }]}>
                          {foundInventory?.status}
                        </Text>
                      </View>
                    </View>

                    <View style={{ gap: spacing(20) }}>
                      <View style={styles.row}>
                        <View style={styles.col}>
                          <View style={[styles.gapRow, { gap: spacing(4) }]}>
                            <Tag size={scale(12)} color={subTextColor} />
                            <Text style={[styles.reg12, { color: subTextColor }]}>CATEGORY</Text>
                          </View>
                          <Text style={[styles.reg14g, { color: textColor }]}>
                            {CapitalizeFirstName(foundInventory?.category)}
                          </Text>
                        </View>

                        <View style={styles.col}>
                          <View style={[styles.gapRow, { gap: spacing(4) }]}>
                            <CircleDollarSign size={scale(12)} color={subTextColor} />
                            <Text style={[styles.reg12, { color: subTextColor }]}>UNIT PRICE</Text>
                          </View>
                          <Text style={[styles.reg14g, { color: textColor }]}>
                            {FormatCurrency(foundInventory?.sellingPricePerUnit ?? 0)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.row}>
                        <View style={styles.col}>
                          <View style={[styles.gapRow, { gap: spacing(4) }]}>
                            <UserIcon size={scale(12)} color={subTextColor} />
                            <Text style={[styles.reg12, { color: subTextColor }]}>SUPPLIER</Text>
                          </View>
                          <Text style={[styles.reg14g, { color: textColor }]}>
                            {CapitalizeFirstName(foundInventory?.supplierName)}
                          </Text>
                        </View>

                        {foundInventory?.color.trim() && (
                          <View style={styles.col}>
                            <View style={[styles.gapRow, { gap: spacing(4) }]}>
                              <SwatchBook size={scale(12)} color={subTextColor} />
                              <Text style={[styles.reg12, { color: subTextColor }]}>COLOR</Text>
                            </View>
                            <Text style={[styles.reg14g, { color: textColor }]}>
                              {CapitalizeFirstName(foundInventory.color)}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={[styles.borderSection, { borderTopColor: borderColor }]}>
                        <View style={styles.col}>
                          <View style={[styles.gapRow, { gap: spacing(4) }]}>
                            <FileText size={scale(12)} color={subTextColor} />
                            <Text style={[styles.reg12, { color: subTextColor }]}>Description</Text>
                          </View>
                          <Text
                            style={[styles.reg14g, { color: textColor, flexShrink: 1 }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {CapitalizeFirstName(foundInventory?.description)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.section}>
                    <View style={[styles.gapRow, { gap: spacing(8) }]}>
                      <Box size={scale(14)} color={iconColor} />
                      <Text style={[styles.reg14g, { color: sectionTitleColor }]}>
                        Stock Information
                      </Text>
                    </View>

                    <View style={[styles.row, { gap: spacing(8) }]}>
                      <View style={[styles.card, { backgroundColor: isDark ? "rgba(22,152,141,0.15)" : "rgba(240, 253, 250, 1)" }]}>
                        <Text style={[styles.reg24, { color: "rgba(22, 152, 141, 1)" }]}>
                          {foundInventory?.quantity}
                        </Text>
                        <Text style={[styles.reg12, { color: subTextColor }]}>Current Stock</Text>
                        <Text style={[styles.reg12, { color: subTextColor }]}>pieces</Text>
                      </View>
                      <View style={[styles.card, { backgroundColor: isDark ? "rgba(245,73,0,0.12)" : "rgba(255, 247, 237, 1)" }]}>
                        <Text style={[styles.reg24, { color: "rgba(245, 73, 0, 1)" }]}>
                          {foundInventory?.reorderPoint}
                        </Text>
                        <Text style={[styles.reg12, { color: subTextColor }]}>Reorder Point</Text>
                        <Text style={[styles.reg12, { color: subTextColor }]}>pieces</Text>
                      </View>
                      <View style={[styles.card, { backgroundColor: isDark ? "rgba(22,152,141,0.15)" : "rgba(240, 253, 244, 1)" }]}>
                        <Text style={[styles.reg24, { color: "rgba(22, 152, 141, 1)" }]}>
                          {FormatNairaShorthand(totalValue.toString())}
                        </Text>
                        <Text style={[styles.reg12, { color: subTextColor }]}>Total Value</Text>
                        <Text style={[styles.reg12, { color: subTextColor }]}>
                          {foundInventory?.quantity ?? 1} x{" "}
                          {FormatCurrency(foundInventory?.sellingPricePerUnit ?? 0)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.section}>
                    <View style={[styles.gapRow, { gap: spacing(8) }]}>
                      <Clock size={scale(15)} color={iconColor} />
                      <Text style={[styles.reg14g, { color: sectionTitleColor }]}>Timeline</Text>
                    </View>

                    <View style={{ gap: spacing(12) }}>
                      <View style={[styles.recBox, { backgroundColor: recBoxBg }]}>
                        <Text style={[styles.reg12, { color: subTextColor }]}>Created</Text>
                        <Text style={[styles.reg14g, { color: textColor }]}>
                          {foundInventory?.createdAt ? formatFintechDate(foundInventory.createdAt) : "N/A"}
                        </Text>
                      </View>
                      <View style={[styles.recBox, { backgroundColor: recBoxBg }]}>
                        <Text style={[styles.reg12, { color: subTextColor }]}>Last Updated</Text>
                        <Text style={[styles.reg14g, { color: textColor }]}>
                          {foundInventory?.updatedAt ? formatFintechDate(foundInventory.updatedAt) : "N/A"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.row, { gap: spacing(80), paddingHorizontal: spacing(16) }]}>
              <HapticTab
                style={styles.primaryBtn}
                onPress={() => {
                  router.push({
                    pathname: "/protected/inventory/[id]",
                    params: { id: foundInventory?.id ?? "" },
                  });
                }}
              >
                <Pencil size={scale(18)} color={"white"} />
                <Text style={styles.btnText}>Edit Item</Text>
              </HapticTab>

              <Pressable style={[styles.deleteBtn, { backgroundColor: isDark ? "rgba(231,0,11,0.15)" : "rgba(254, 242, 242, 1)" }]} onPress={handleDelete} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size={"small"} color={"rgba(231, 0, 11, 1)"} />
                ) : (
                  <Trash2 size={scale(15)} color={"rgba(231, 0, 11, 1)"} />
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
};

export default ViewInventoryItemScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: spacing(8),
  },
  col: {
    flexShrink: 1,
    gap: spacing(4),
  },
  reg20: {
    fontFamily: "regular",
    fontSize: scaleFontSize(20),
    color: "rgba(10, 10, 10, 1)",
    lineHeight: 28,
  },
  reg24: {
    fontFamily: "regular",
    fontSize: scaleFontSize(24),
    color: "rgba(10, 10, 10, 1)",
  },
  reg14g: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
    color: "rgba(106, 114, 130, 1)",
    lineHeight: 20,
  },
  reg12: {
    fontFamily: "regular",
    fontSize: scaleFontSize(12),
    color: "rgba(106, 114, 130, 1)",
  },
  reg30: {
    fontFamily: "regular",
    fontSize: scaleFontSize(30),
    color: "white",
    lineHeight: 36,
  },
  content: {
    flex: 1,
    // paddingVertical: spacing(20),
    paddingHorizontal: 16,
    gap: spacing(14),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gapRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sections: {
    gap: spacing(15),
    paddingVertical: spacing(20),
  },
  section: {
    gap: spacing(16),
  },
  box: {
    gap: spacing(16),
    padding: spacing(16),
    borderRadius: 16,
  },
  badge: {
    alignSelf: "center",
    backgroundColor: "rgba(254, 242, 242, 1)",
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(5),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  borderSection: {
    paddingVertical: spacing(12),
    flexShrink: 1,
    gap: spacing(4),
    borderTopWidth: 0.5,
    borderTopColor: "rgba(54, 65, 83, 1)",
  },
  card: {
    flex: 1,
    height: 120,
    gap: spacing(4),
    padding: spacing(16),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  recBox: {
    padding: spacing(16),
    gap: spacing(4),
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
