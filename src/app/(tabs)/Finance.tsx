import GlassCard from "@/src/components/dashboard/boxes/GlassBox";
import IncomeExpenseChart from "@/src/components/finance/IncomeExpenseChart";
import { HapticTab } from "@/src/components/haptic-tab";
import TransactionItem from "@/src/components/transaction/Item";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useFinanceStore } from "@/src/stores/financeSlice";
import { useUserStore } from "@/src/stores/userSlice";
import { Expense, Income } from "@/src/types/finance";
import {
  FormatCurrency,
  GetCurrentMonthYear,
  scale,
  scaleFontSize,
  spacing,
} from "@/src/utils/random";
import { router, useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Menu, Plus } from "lucide-react-native";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADER_SCROLL_DISTANCE = 100;

// ─── Financial calculations ──────────────────────────────────────────────────
export function calculateFinancialSummary(income: Income[], expenses: Expense[]) {
  const safeIncome = income ?? [];
  const safeExpenses = expenses ?? [];
  const totalIncome = safeIncome.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const totalExpenses = safeExpenses.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyIncome = safeIncome
    .filter((item) => {
      if (!item.date) return false;
      const d = new Date(item.date);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, item) => sum + (item.amount ?? 0), 0);

  const monthlyExpenses = safeExpenses
    .filter((item) => {
      if (!item.date) return false;
      const d = new Date(item.date);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, item) => sum + (item.amount ?? 0), 0);

  return {
    totalIncome,
    totalExpenses,
    netProfit,
    profitMargin,
    monthlyIncome,
    monthlyExpenses,
    monthlyProfit: monthlyIncome - monthlyExpenses,
  };
}

// ─── Summary boxes ──────────────────────────────────────────────────────────
const RowBoxes = () => {
  const finance = useFinanceStore();
  const summary = calculateFinancialSummary(finance.income, finance.expenses);

  return (
    <View style={{ gap: spacing(10) }}>
      <View style={styles.row}>
        <GlassCard style={styles.box}>
          <Text style={[Styles.reg14, { color: "white", lineHeight: 18 }]}>Net Profit</Text>
          <Text style={styles.valueBox}>{FormatCurrency(summary.netProfit)}</Text>
        </GlassCard>
        <GlassCard style={styles.box}>
          <Text style={[Styles.reg14, { color: "white", lineHeight: 18 }]}>Total Income</Text>
          <Text style={styles.valueBox}>{FormatCurrency(summary.totalIncome)}</Text>
        </GlassCard>
      </View>
      <View style={styles.row}>
        <GlassCard style={styles.box}>
          <Text style={[Styles.reg14, { color: "white", lineHeight: 18 }]}>Total Expenses</Text>
          <Text style={styles.valueBox}>{FormatCurrency(summary.totalExpenses)}</Text>
        </GlassCard>
        <GlassCard style={styles.box}>
          <Text style={[Styles.reg14, { color: "white", lineHeight: 18 }]}>Monthly Profit</Text>
          <Text style={styles.valueBox}>{FormatCurrency(summary.monthlyProfit)}</Text>
        </GlassCard>
      </View>
    </View>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────
const FinanceScreen = () => {
  const { isDark } = useTheme();
  const { top, bottom } = useSafeAreaInsets();
  const navigation = useNavigation();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const subTextColor = isDark ? "rgba(160,160,160,1)" : "#999";
  const headerSolidColor = isDark ? "#0f0f0f" : "white";
  const themeIconColor = isDark ? Colors.text.white : Colors.text.black;
  const emptyTextColor = isDark ? "rgba(120,120,120,1)" : "#666";

  const loading = useFinanceStore((state) => state.loading);
  const incomes = useFinanceStore((state) => state.income);
  const expenses = useFinanceStore((state) => state.expenses);
  const fetchTransactions = useFinanceStore((state) => state.getTransactionsByTailor);
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (user) fetchTransactions("");
  }, [user]);

  const hasTransactions = incomes.length > 0 || expenses.length > 0;

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

      {/* ── Scrollable layer — bg image scrolls with content ── */}
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
            onRefresh={() => fetchTransactions("")}
            tintColor={Colors.primary}
            progressViewOffset={HEADER_HEIGHT}
          />
        }
      >
        {/* Hero — scrolls away */}
        <ImageBackground
          source={require("@/assets/images/screen_bg.png")}
          style={[styles.heroBg, { paddingTop: top + spacing(56) }]}
        >
          <View style={{ paddingHorizontal: 16, paddingBottom: spacing(24), gap: spacing(16) }}>
            <View style={{ gap: spacing(4) }}>
              <Text style={styles.heroTitle}>Financial Dashboard</Text>
              <Text style={[Styles.reg14, { color: "rgba(255,255,255,0.8)", lineHeight: 18 }]}>
                {GetCurrentMonthYear()}
              </Text>
            </View>
            <RowBoxes />
          </View>
        </ImageBackground>

        {/* Content card */}
        <View style={[styles.content, { backgroundColor: bg }]}>
          <View style={{ gap: spacing(25), paddingTop: spacing(26), paddingBottom: bottom + 100 }}>

            <Pressable
              onPress={() => router.push("/protected/form/create-transaction")}
              style={styles.addBtn}
            >
              <Plus size={scale(16)} color="white" />
              <Text style={[Styles.reg16, { color: "white" }]}>Add Transaction</Text>
            </Pressable>

            {hasTransactions ? (
              <IncomeExpenseChart incomes={incomes} expenses={expenses} />
            ) : (
              <View style={styles.emptyChartContainer}>
                <Text style={[styles.emptyChartText, { color: emptyTextColor }]}>
                  No transactions yet. Add your first transaction to see your financial overview.
                </Text>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.row}>
                <Text style={[Styles.reg16, { color: textColor }]}>Recent Transactions</Text>
              </View>

              {loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              ) : hasTransactions ? (
                [...incomes, ...expenses]
                  .sort((a, b) => {
                    const dateA = a.date ? new Date(a.date).getTime() : 0;
                    const dateB = b.date ? new Date(b.date).getTime() : 0;
                    return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
                  })
                  .map((transaction, index) => (
                    <TransactionItem key={transaction.id || index} item={transaction} />
                  ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: subTextColor }]}>
                    No transactions to display
                  </Text>
                </View>
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
            Finance
          </Animated.Text>

          <View style={{ width: scale(24) }} />
        </View>
      </View>

      {/* ── Floating action button ── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: bottom + spacing(24) }]}
        onPress={() => router.push("/protected/form/create-transaction")}
        activeOpacity={0.85}
      >
        <Plus size={scale(24)} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default FinanceScreen;

const styles = StyleSheet.create({
  heroBg: {
    backgroundColor: Colors.primary,
    paddingBottom: spacing(24),
  },
  heroTitle: {
    fontFamily: "semibold",
    fontSize: scaleFontSize(24),
    lineHeight: 30,
    color: "white",
  },
  content: {
    flex: 1,
    borderTopRightRadius: 40,
    borderTopLeftRadius: 40,
    paddingHorizontal: spacing(16),
    marginTop: spacing(-40),
     height:'100%',
  },
  section: {
    gap: spacing(16),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing(10),
  },
  box: {
    flex: 1,
    height: 95,
    padding: spacing(17),
    flexDirection: "column",
    justifyContent: "space-between",
  },
  valueBox: {
    fontFamily: "semibold",
    fontSize: scaleFontSize(20),
    lineHeight: 26,
    color: "white",
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
  addBtn: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing(8),
    gap: spacing(5),
    height: 40,
    borderRadius: 12,
  },
  emptyChartContainer: {
    padding: spacing(30),
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  emptyChartText: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
    textAlign: "center",
    lineHeight: 20,
  },
  emptyState: {
    padding: spacing(30),
    alignItems: "center",
  },
  emptyStateText: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
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
