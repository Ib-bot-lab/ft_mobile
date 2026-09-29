import PrimaryButton from "@/src/components/button/PrimaryButton";
import { HapticTab } from "@/src/components/haptic-tab";
import SelectFilterModal from "@/src/components/shared/modal/SelectFilterModal";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { generateExpenseId, generateIncomeId } from "@/src/lib/finance";
import { useFinanceStore } from "@/src/stores/financeSlice";
import { Expense, Income, TransactionType } from "@/src/types/finance";
import {
  CapitalizeFirstName,
  formatPrice,
  GetDetailedDate,
  scale,
  scaleFontSize,
  spacing,
} from "@/src/utils/random";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  ChevronDown,
  ChevronLeft,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
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
import DatePicker from "react-native-date-picker";

const Types = [
  { label: "Income", value: "income" },
  { label: "Expenses", value: "expense" },
];

const CategoryList = [
  { label: "Materials", value: "materials" },
  { label: "Rent", value: "rent" },
  { label: "Utilities", value: "utilities" },
  { label: "Equipment", value: "equipment" },
  { label: "Marketing", value: "marketing" },
  { label: "Transportation", value: "transportation" },
  { label: "Meals", value: "meals" },
  { label: "Insurance", value: "insurance" },
  { label: "Taxes", value: "taxes" },
  { label: "Other", value: "other" },
];

const sourceList = [
  { label: "Order Payment", value: "order_payment" },
  { label: "Deposit", value: "deposit" },
  { label: "Alteration", value: "alteration" },
  { label: "Consultation", value: "consultation" },
  { label: "Other", value: "other" },
];

const parseAmount = (value: string) => {
  if (!value) return NaN;
  return Number(value.replace(/,/g, "").trim());
};

const CreateTransactionScreen = () => {
  const saveTransaction = useFinanceStore((state) => state.saveTransaction);
  const loading = useFinanceStore((state) => state.loading);

  const { isDark } = useTheme();
  const { top } = useSafeAreaInsets();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : "rgba(54, 65, 83, 1)";
  const labelColor = isDark ? "rgba(160,160,160,1)" : "#4A5565";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "white";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : Colors.inputBorder;
  const inputTextColor = isDark ? Colors.text.white : Colors.black;
  const placeholderColor = isDark ? "rgba(100,100,100,1)" : Colors.grayText;
  const dropdownActiveColor = isDark ? Colors.text.white : "rgba(10, 10, 10, 1)";
  const chevronColor = isDark ? "rgba(160,160,160,1)" : Colors.grey;
  const inactiveBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(229, 231, 235, 1)";
  const inactiveText = isDark ? "rgba(100,100,100,1)" : "rgba(160, 160, 160, 1)";

  const [sourceModal, setSourceModal] = useState(false);
  const toggleSourceModal = () => setSourceModal((prev) => !prev);
  const [categoryModal, setCategoryModal] = useState(false);
  const toggleCategoryModal = () => setCategoryModal((prev) => !prev);
  const [showPicker, setShowPicker] = useState(false);

  const [selectedType, setSelectedType] = useState<TransactionType>("expense");
  const [transaction, setTransaction] = useState<Income & Expense>({
    id: "", description: "", type: selectedType, amount: 0,
    source: "deposit", category: "materials",
    date: new Date().toISOString(), notes: "", userEmail: "", createdAt: "", updatedAt: "",
  });

  const [error, setError] = useState({ amount: "", category: "", source: "", date: "", description: "" });

  const handleDataChange = (field: keyof typeof transaction, value: string | number) => {
    setTransaction({ ...transaction, [field]: value });
    if (error[field as keyof typeof error]) setError((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { amount: "", category: "", source: "", date: "", description: "" };
    const amount = parseAmount(transaction.amount.toString());
    if (isNaN(amount) || amount <= 0) { newErrors.amount = "Enter a valid amount"; isValid = false; }
    if (!transaction.description.trim()) { newErrors.description = "Description is required"; isValid = false; }
    if (selectedType === "income" && !transaction.source) { newErrors.source = "Source is required"; isValid = false; }
    if (selectedType === "expense" && !transaction.category) { newErrors.category = "Category is required"; isValid = false; }
    setError(newErrors);
    return isValid;
  };

  const handleSaveTransaction = async () => {
    if (!validateForm()) return;
    const isIncome = selectedType === "income";
    const amount = parseAmount(transaction.amount.toString());
    const now = new Date().toISOString();
    const { source, category, ...rest } = transaction;
    try {
      const normalizedType = (selectedType.charAt(0).toUpperCase() + selectedType.slice(1)) as TransactionType;
      const payload: Income | Expense = {
        ...rest,
        ...(isIncome ? { source } : { category }),
        id: isIncome ? generateIncomeId() : generateExpenseId(),
        type: normalizedType, amount,
        userEmail: "",
        date: now, createdAt: now, updatedAt: now,
      };
      await saveTransaction(payload as any, selectedType as any);
      handleBack();
    } catch (err) {
      console.log("Error saving transaction:", err);
    }
  };

  useEffect(() => { console.log("selected type", selectedType); }, [selectedType]);

  const handleBack = () => router.replace("/(tabs)/Finance");

  const inputStyle = [Styles.input, { paddingVertical: 0, paddingHorizontal: spacing(16), backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }];

  return (
    <>
      <View style={{ flex: 1, paddingTop: top, backgroundColor: bg }}>
        <StatusBar style={isDark ? "light" : "dark"} />

        <View style={styles.header}>
          <HapticTab style={styles.backBtn} onPress={handleBack}>
            <ChevronLeft size={scale(20)} color={isDark ? "rgba(200,200,200,1)" : "rgba(54, 65, 83, 1)"} strokeWidth={1.5} />
          </HapticTab>
          <Text style={[styles.reg24, { color: textColor }]}>Add Transaction</Text>
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
              {/* type toggle */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Type</Text>
                <View style={[styles.row, { gap: spacing(12) }]}>
                  {Types.map((type) => {
                    const isSelected = type.value === selectedType;
                    const isIncome = type.value === "income";
                    const Icon = isIncome ? ArrowUpCircle : ArrowDownCircle;
                    const activeColor = isIncome
                      ? { bg: "rgba(0, 201, 80, 0.15)", stroke: "rgba(0, 166, 62, 1)", text: "rgba(0, 166, 62, 1)" }
                      : { bg: isDark ? "rgba(193,0,7,0.2)" : "rgba(255, 226, 226, 1)", stroke: "rgba(231, 0, 11, 1)", text: "rgba(231, 0, 11, 1)" };
                    const colors = isSelected ? activeColor : { bg: "transparent", stroke: inactiveBorder, text: inactiveText };
                    return (
                      <Pressable
                        key={type.value}
                        onPress={() => { setSelectedType(type.value as TransactionType); handleDataChange("type", type.value); }}
                        style={[styles.tranBox, { backgroundColor: colors.bg, borderColor: colors.stroke }]}
                      >
                        <Icon size={scale(20)} color={colors.text} />
                        <Text style={[Styles.reg14, { color: colors.text }]}>{type.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* amount */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Amount (₦)<Text style={styles.red}> *</Text></Text>
                <TextInput
                  value={formatPrice(transaction.amount.toString())}
                  onChangeText={(text) => handleDataChange("amount", text)}
                  placeholder="e.g., 50000"
                  placeholderTextColor={placeholderColor}
                  keyboardType="number-pad"
                  style={inputStyle}
                />
                {error.amount ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.amount}</Text> : null}
              </View>

              {/* category or source */}
              {selectedType === "expense" ? (
                <View style={Styles.inputContainer} key="expense">
                  <Text style={[Styles.label, { color: labelColor }]}>Category<Text style={styles.red}> *</Text></Text>
                  <Pressable style={[Styles.input, { ...styles.row, paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder }]} onPress={toggleCategoryModal}>
                    <Text style={[Styles.reg16, { color: dropdownActiveColor }]}>{CapitalizeFirstName(transaction.category)}</Text>
                    <ChevronDown size={scale(20)} color={chevronColor} />
                  </Pressable>
                </View>
              ) : (
                <View style={Styles.inputContainer} key="income">
                  <Text style={[Styles.label, { color: labelColor }]}>Source<Text style={styles.red}> *</Text></Text>
                  <Pressable style={[Styles.input, { ...styles.row, paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder }]} onPress={toggleSourceModal}>
                    <Text style={[Styles.reg16, { color: dropdownActiveColor }]}>{CapitalizeFirstName(transaction.source)}</Text>
                    <ChevronDown size={scale(20)} color={chevronColor} />
                  </Pressable>
                </View>
              )}

              {/* date */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Date<Text style={styles.red}> *</Text></Text>
                <Pressable
                  style={[Styles.input, { ...styles.gapRow, paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder }]}
                  onPress={() => setShowPicker(true)}
                >
                  <Calendar size={scale(20)} color={chevronColor} />
                  <Text style={[Styles.reg16, { color: transaction.date ? dropdownActiveColor : "rgba(10,10,10,0.5)" }]}>
                    {transaction.date ? GetDetailedDate(transaction.date) : "Select date"}
                  </Text>
                </Pressable>
                {showPicker && (
                  <DatePicker
                    modal open={showPicker}
                    date={transaction.date ? new Date(transaction.date) : new Date()}
                    mode="date"
                    onConfirm={(date) => { setShowPicker(false); setTransaction({ ...transaction, date: date.toISOString() }); }}
                    onCancel={() => setShowPicker(false)}
                  />
                )}
              </View>

              {/* description */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Description<Text style={styles.red}> *</Text></Text>
                <TextInput
                  value={transaction.description}
                  onChangeText={(text) => handleDataChange("description", text)}
                  placeholder="Add details about this transaction..."
                  placeholderTextColor={placeholderColor}
                  multiline numberOfLines={20}
                  style={[Styles.input, { height: 90, textAlignVertical: "top", paddingTop: spacing(15), paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
                {error.description ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.description}</Text> : null}
              </View>

              <View style={styles.button}>
                <PrimaryButton title="Add Transaction" onPress={handleSaveTransaction} loading={loading} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {categoryModal && (
        <SelectFilterModal data={CategoryList} visible={categoryModal} handleOption={(o) => handleDataChange("category", o)} selected={transaction.category} onClose={() => setCategoryModal(false)} />
      )}
      {sourceModal && (
        <SelectFilterModal data={sourceList} visible={sourceModal} handleOption={(o) => handleDataChange("source", o)} selected={transaction.source} onClose={() => setSourceModal(false)} />
      )}
    </>
  );
};

export default CreateTransactionScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing(8),
    paddingHorizontal: spacing(16),
    paddingTop: spacing(12),
    paddingBottom: spacing(8),
  },
  backBtn: { width: 32, aspectRatio: 1, justifyContent: "center", alignItems: "center" },
  reg24: { fontFamily: "regular", fontSize: scaleFontSize(24), lineHeight: 32 },
  content: { flex: 1, paddingHorizontal: 16, gap: spacing(14) },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  red: { color: "rgba(251, 44, 54, 1)" },
  gapRow: { flexDirection: "row", justifyContent: "flex-start", alignItems: "center", gap: spacing(14) },
  tranBox: { flex: 1, height: 80, justifyContent: "center", alignItems: "center", gap: spacing(6), borderWidth: 1.1, borderRadius: 14 },
  button: { flex: 1, justifyContent: "flex-end" },
});
