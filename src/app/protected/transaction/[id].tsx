import { HapticTab } from "@/src/components/haptic-tab";
import TransactionItem from "@/src/components/transaction/Item";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useFinanceStore } from "@/src/stores/financeSlice";
import {
  CapitalizeFirstName,
  FormatCurrency,
  FormatOrderDate,
  scale,
  scaleFontSize,
  spacing,
} from "@/src/utils/random";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TransactionDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const transactionId = id.toString();

  const loading = useFinanceStore((state) => state.loading);
  const incomes = useFinanceStore((state) => state.income);
  const expenses = useFinanceStore((state) => state.expenses);
  const deleteTransaction = useFinanceStore((state) => state.deleteTransaction);
  const transaction = [...incomes, ...expenses].find((prev) => prev.id === transactionId);

  const { isDark } = useTheme();
  const { top } = useSafeAreaInsets();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : "rgba(54, 65, 83, 1)";
  const labelColor = isDark ? "rgba(160,160,160,1)" : "#6A7282";
  const valueColor = isDark ? Colors.text.white : Colors.text.black;
  const dividerColor = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  const sectionBorder = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  const editBtnBg = isDark ? "rgba(255,255,255,0.12)" : Colors.black;

  const isExpense = transaction && transaction.type !== "income";
  const sourceLabel = isExpense ? "Category" : "Source";
  const source = isExpense ? (transaction as any)?.category : (transaction as any)?.source;
  const totalColor = isExpense ? "#E7000B" : "rgba(0, 166, 62, 1)";

  const handleBack = () => router.replace("/(tabs)/Finance");

  const handleDeleteTransaction = async () => {
    try {
      await deleteTransaction(transaction?.id ?? "");
      handleBack();
    } catch (err) {
      console.error("Error deleting transaction", err);
    }
  };

  return (
    <>
      <View style={{ flex: 1, paddingTop: top, backgroundColor: bg }}>
        <StatusBar style={isDark ? "light" : "dark"} />

        <View style={[styles.header, { paddingHorizontal: spacing(16), paddingTop: spacing(12), paddingBottom: spacing(8) }]}>
          <HapticTab style={styles.backBtn} onPress={handleBack}>
            <ChevronLeft size={scale(20)} color={isDark ? "rgba(200,200,200,1)" : "rgba(54, 65, 83, 1)"} strokeWidth={1.5} />
          </HapticTab>
          <Text style={[styles.reg24, { color: textColor }]}>Transaction Details</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ flexGrow: 1, paddingVertical: spacing(20) }}
          keyboardDismissMode="interactive"
        >
          <View style={styles.content}>
            {transaction && <TransactionItem item={transaction} pressable={false} />}

            {/* meta details */}
            <View style={styles.rowDetails}>
              <View style={styles.row}>
                <Text style={[styles.reg14, { color: labelColor }]}>Reference Number</Text>
                <Text style={[styles.reg13, { color: valueColor }]}>{transaction?.id}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.reg14, { color: labelColor }]}>Transaction Time</Text>
                <Text style={[styles.reg13, { color: valueColor }]}>{FormatOrderDate(transaction?.date ?? "")}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.reg14, { color: labelColor }]}>{sourceLabel}</Text>
                <Text style={[styles.reg13, { color: valueColor }]}>{CapitalizeFirstName(source)}</Text>
              </View>
            </View>

            {/* amount breakdown */}
            <View style={[styles.rowDetails, styles.dashBorder, { borderTopColor: sectionBorder }]}>
              <Text style={[styles.reg14, { color: labelColor }]}>Amount Breakdown</Text>
              <View style={styles.row}>
                <Text style={[styles.reg14, { color: labelColor }]}>Subtotal</Text>
                <Text style={[styles.reg13, { color: valueColor }]}>
                  {FormatCurrency((transaction?.amount ?? 0).toString())}
                </Text>
              </View>
              <View style={[styles.row, { borderTopWidth: 0.8, borderTopColor: dividerColor, paddingTop: spacing(12) }]}>
                <Text style={[styles.reg16, { color: valueColor }]}>Total Amount</Text>
                <Text style={[styles.reg24, { fontSize: scaleFontSize(20), color: totalColor }]}>
                  {isExpense ? "-" : "+"}{FormatCurrency((transaction?.amount ?? 0).toString())}
                </Text>
              </View>
            </View>
          </View>

          {/* action buttons */}
          <View style={[styles.row, { gap: spacing(20), paddingBottom: spacing(30), paddingHorizontal: 16 }]}>
            <HapticTab
              style={[styles.btn, { backgroundColor: editBtnBg }]}
              onPress={() => {
                if (!transaction) return;
                router.push({ pathname: "/protected/editTransaction/[id]", params: { id: transaction.id } });
              }}
            >
              <Pencil size={scale(12)} color="white" />
              <Text style={[styles.reg14, { color: "white" }]}>Edit</Text>
            </HapticTab>
            <HapticTab
              style={[styles.btn, { backgroundColor: "rgba(231,0,11,1)" }]}
              onPress={handleDeleteTransaction}
            >
              {loading ? (
                <ActivityIndicator size={scale(20)} color="white" />
              ) : (
                <>
                  <Trash2 size={scale(12)} color="white" />
                  <Text style={[styles.reg14, { color: "white" }]}>Delete</Text>
                </>
              )}
            </HapticTab>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

export default TransactionDetailScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing(8),
  },
  backBtn: {
    width: 32,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  reg13: {
    fontFamily: "regular",
    fontSize: scaleFontSize(13),
    textAlign: "right",
    flexShrink: 1,
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
    gap: spacing(16),
    paddingTop: spacing(10),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing(20),
  },
  rowDetails: {
    gap: spacing(16),
    marginBottom: spacing(10),
  },
  dashBorder: {
    borderStyle: "dashed",
    borderTopWidth: 1,
    paddingTop: spacing(10),
  },
  btn: {
    flex: 1,
    height: 40,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing(20),
    borderRadius: 20,
  },
});
