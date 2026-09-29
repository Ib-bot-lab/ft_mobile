import PrimaryButton from "@/src/components/button/PrimaryButton";
import { HapticTab } from "@/src/components/haptic-tab";
import SelectFilterModal from "@/src/components/shared/modal/SelectFilterModal";
import { categoryList, statusList, unitList } from "@/src/constants/config";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { getCurrentUserEmail } from "@/src/lib/auth-utils";
import { useInventoryStore } from "@/src/stores/inventorySlice";
import { InventoryItem } from "@/src/types/inventory";
import {
  CapitalizeFirstName,
  formatPrice,
  scale,
  scaleFontSize,
  spacing,
} from "@/src/utils/random";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronDown, ChevronLeft } from "lucide-react-native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EditInventoryScreen = () => {
  const { id } = useLocalSearchParams();
  const stocks = useInventoryStore((state) => state.stocks);
  const foundInventory = stocks.find((prev) => prev.id === id.toString())!;

  const editInventoryItem = useInventoryStore(
    (state) => state.editInventoryItem,
  );
  const loading = useInventoryStore((state) => state.loading);

  const { isDark } = useTheme();
  const { top } = useSafeAreaInsets();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : "rgba(54, 65, 83, 1)";
  const labelColor = isDark ? "rgba(160,160,160,1)" : Colors.label;
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "white";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : Colors.inputBorder;
  const inputTextColor = isDark ? Colors.text.white : Colors.black;
  const placeholderColor = isDark ? "rgba(100,100,100,1)" : Colors.grayText;
  const dropdownTextColor = isDark ? "rgba(200,200,200,1)" : "rgba(10, 10, 10, 0.5)";
  const chevronColor = isDark ? "rgba(160,160,160,1)" : Colors.grey;

  const [categoryModal, setCategoryModal] = useState(false);
  const toggleCategoryModal = () => setCategoryModal((prev) => !prev);
  const [unitModal, setUnitModal] = useState(false);
  const toggleUnitModal = () => setUnitModal((prev) => !prev);
  const [statusModal, setStatusModal] = useState(false);
  const toggleStatusModal = () => setStatusModal((prev) => !prev);

  const [stockData, setStockData] = useState<InventoryItem>(foundInventory);

  const [error, setError] = useState({
    name: "",
    supplier: "",
    quantity: "",
    sellingPricePerUnit: "",
  });

  const handleDataChange = (
    field: keyof typeof stockData,
    value: string | number,
  ) => {
    setStockData({ ...stockData, [field]: value });
    if (error[field as keyof typeof error]) {
      setError((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newError = {
      name: "",
      supplier: "",
      quantity: "",
      sellingPricePerUnit: "",
    };

    let isValid = true;

    if (!stockData.name.trim()) {
      newError.name = "Item name is required";
      isValid = false;
    }

    if (!stockData.supplier.trim()) {
      newError.supplier = "Supplier is required";
      isValid = false;
    }

    if (!stockData.quantity || stockData.quantity <= 0) {
      newError.quantity = "Quantity must be greater than 0";
      isValid = false;
    }

    if (!stockData.sellingPricePerUnit || stockData.sellingPricePerUnit <= 0) {
      newError.sellingPricePerUnit = "Selling price must be greater than 0";
      isValid = false;
    }

    setError(newError);
    return isValid;
  };

  const handledEditStock = async () => {
    const isValid = validateForm();
    console.log("editing", isValid);

    if (!isValid) return;

    try {
      const payload: InventoryItem = {
        ...stockData,
        totalValue: stockData.quantity * (stockData?.sellingPricePerUnit ?? 1),
        tailorId: getCurrentUserEmail(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await editInventoryItem(stockData.id, payload);
      handleBack();
    } catch (error) {
      console.log("Error editing inventory item:", error);
    }
  };

  const handleBack = () => {
    router.replace("/(tabs)/Inventory");
  };

  return (
    <>
      <View style={{ flex: 1, paddingTop: top, backgroundColor: bg }}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.header}>
          <HapticTab
            style={{ width: 32, aspectRatio: 1, justifyContent: "center", alignItems: "center" }}
            onPress={handleBack}
          >
            <ChevronLeft size={scale(20)} color={isDark ? "rgba(200,200,200,1)" : "rgba(54, 65, 83, 1)"} strokeWidth={1.5} />
          </HapticTab>
          <Text style={[styles.reg24, { color: textColor }]}>Edit Inventory Item</Text>
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
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>
                  Name<Text style={styles.red}> *</Text>
                </Text>
                <TextInput
                  value={stockData.name}
                  onChangeText={(text) => handleDataChange("name", text)}
                  placeholder="e.g., Ankara Print Fabric"
                  placeholderTextColor={placeholderColor}
                  returnKeyType="next"
                  keyboardType="default"
                  autoCorrect={false}
                  style={[Styles.input, { paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
                {error.name ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.name}</Text> : null}
              </View>

              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Category</Text>
                <Pressable
                  style={[Styles.input, { ...styles.row, paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder }]}
                  onPress={toggleCategoryModal}
                >
                  <Text style={[Styles.reg16, { color: dropdownTextColor }]}>{CapitalizeFirstName(stockData.category)}</Text>
                  <ChevronDown size={scale(20)} color={chevronColor} />
                </Pressable>
              </View>

              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>
                  Supplier<Text style={styles.red}> *</Text>
                </Text>
                <TextInput
                  value={stockData.supplier}
                  onChangeText={(text) => handleDataChange("supplier", text)}
                  placeholder="e.g., Lagos Textiles Ltd"
                  placeholderTextColor={placeholderColor}
                  returnKeyType="next"
                  keyboardType="default"
                  autoCorrect={false}
                  style={[Styles.input, { paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
                {error.supplier ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.supplier}</Text> : null}
              </View>

              <View style={Styles.inputContainer}>
                <View style={[styles.row, { gap: spacing(20) }]}>
                  <View style={[Styles.inputContainer, { flex: 1 }]}>
                    <Text style={[Styles.label, { color: labelColor }]}>
                      Quantity<Text style={styles.red}> *</Text>
                    </Text>
                    <TextInput
                      value={stockData.quantity.toString()}
                      onChangeText={(text) => handleDataChange("quantity", Number(text))}
                      placeholder="Quantity"
                      placeholderTextColor={placeholderColor}
                      returnKeyType="next"
                      keyboardType="number-pad"
                      autoCorrect={false}
                      style={[Styles.input, { paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                    />
                  </View>
                  <View style={[Styles.inputContainer, { flex: 1 }]}>
                    <Text style={[Styles.label, { color: labelColor }]}>Unit</Text>
                    <Pressable
                      style={[Styles.input, { ...styles.row, paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder }]}
                      onPress={toggleUnitModal}
                    >
                      <Text style={[Styles.reg16, { color: dropdownTextColor }]}>{CapitalizeFirstName(stockData.unit)}</Text>
                      <ChevronDown size={scale(20)} color={chevronColor} />
                    </Pressable>
                  </View>
                </View>
                {error.quantity ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.quantity}</Text> : null}
              </View>

              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Status</Text>
                <Pressable
                  style={[Styles.input, { ...styles.row, paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder }]}
                  onPress={toggleStatusModal}
                >
                  <Text style={[Styles.reg16, { color: dropdownTextColor }]}>
                    {CapitalizeFirstName(statusList.find((s) => s.value === stockData.status)?.label ?? stockData.status)}
                  </Text>
                  <ChevronDown size={scale(20)} color={chevronColor} />
                </Pressable>
              </View>

              <View style={Styles.inputContainer}>
                <View style={[styles.row, { gap: spacing(20) }]}>
                  <View style={[Styles.inputContainer, { flex: 1 }]}>
                    <Text style={[Styles.label, { color: labelColor }]}>
                      Price per Unit (₦)<Text style={styles.red}> *</Text>
                    </Text>
                    <TextInput
                      value={formatPrice((stockData.sellingPricePerUnit ?? 1).toString())}
                      onChangeText={(text) => handleDataChange("sellingPricePerUnit", Number(text))}
                      placeholder="Price per unit"
                      placeholderTextColor={placeholderColor}
                      returnKeyType="next"
                      keyboardType="number-pad"
                      autoCorrect={false}
                      style={[Styles.input, { paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                    />
                  </View>
                  <View style={[Styles.inputContainer, { flex: 1 }]}>
                    <Text style={[Styles.label, { color: labelColor }]}>Min Stock Alert</Text>
                    <TextInput
                      value={(stockData.minStockLevel ?? 1).toString()}
                      onChangeText={(text) => handleDataChange("minStockLevel", Number(text))}
                      placeholder="Minimum Stock Level"
                      placeholderTextColor={placeholderColor}
                      returnKeyType="next"
                      keyboardType="number-pad"
                      autoCorrect={false}
                      style={[Styles.input, { paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                    />
                  </View>
                </View>
                {error.sellingPricePerUnit ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.sellingPricePerUnit}</Text> : null}
              </View>

              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Description</Text>
                <TextInput
                  value={stockData.description}
                  onChangeText={(text) => handleDataChange("description", text)}
                  placeholder="Add notes about this item..."
                  placeholderTextColor={placeholderColor}
                  returnKeyType="next"
                  autoCorrect={false}
                  multiline
                  numberOfLines={20}
                  style={[Styles.input, { height: 100, textAlignVertical: "top", paddingTop: spacing(15), paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
              </View>

              <View style={styles.button}>
                <PrimaryButton title="Edit Item" onPress={handledEditStock} loading={loading} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      {categoryModal && (
        <SelectFilterModal
          data={categoryList}
          visible={categoryModal}
          handleOption={(option) => handleDataChange("category", option)}
          selected={stockData.category}
          onClose={() => setCategoryModal(false)}
        />
      )}
      {statusModal && (
        <SelectFilterModal
          data={statusList}
          visible={statusModal}
          handleOption={(option) => handleDataChange("status", option)}
          selected={stockData.status}
          onClose={() => setStatusModal(false)}
        />
      )}
      {unitModal && (
        <SelectFilterModal
          data={unitList}
          visible={unitModal}
          handleOption={(option) => handleDataChange("unit", option)}
          selected={stockData.unit}
          onClose={() => setUnitModal(false)}
        />
      )}
    </>
  );
};

export default EditInventoryScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: spacing(8),
  },
  col: {
    gap: spacing(4),
  },
  reg24: {
    fontFamily: "regular",
    fontSize: scaleFontSize(24),
    color: "rgba(54, 65, 83, 1)",
    lineHeight: 32,
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
  red: {
    color: "rgba(251, 44, 54, 1)",
  },
  button: {
    flex: 1,
    justifyContent: "flex-end",
  },
});
