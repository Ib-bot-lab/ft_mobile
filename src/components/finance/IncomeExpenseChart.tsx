import { Expense, Income } from "@/src/types/finance";
import { scaleFontSize, spacing } from "@/src/utils/random";
import { ChevronDown } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

const screenWidth = Dimensions.get("window").width;

interface IncomeExpenseChartProps {
  incomes: Income[];
  expenses: Expense[];
}

type TimeFilter = "alltime" | `month-${number}`;

const formatYAxisLabel = (value: number): string => {
  if (value === 0) return "0";
  if (value >= 1_000_000_000)
    return `${(value / 1_000_000_000).toFixed(value % 1_000_000_000 === 0 ? 0 : 1)}b`;
  if (value >= 1_000_000)
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}m`;
  return `${Math.round(value / 1000)}k`;
};

const generateMonthOptions = (): { label: string; value: TimeFilter }[] => {
  const months: { label: string; value: TimeFilter }[] = [];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();

  for (let i = 0; i <= currentMonth; i++) {
    const date = new Date(currentDate.getFullYear(), i, 1);
    months.push({
      label: date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      value: `month-${i}` as TimeFilter,
    });
  }

  return months;
};

const FILTER_OPTIONS: { label: string; value: TimeFilter }[] = [
  { label: "All Time", value: "alltime" },
  ...generateMonthOptions(),
];

const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({
  incomes,
  expenses,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<TimeFilter>("alltime");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const chartWidth = screenWidth - 32;
  const chartHeight = 280;
  const paddingLeft = 35;
  const paddingRight = 35;
  const paddingTop = 20;
  const paddingBottom = 20;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const chartData = useMemo(() => {
    if (incomes.length === 0 && expenses.length === 0) {
      return [];
    }

    const now = new Date();
    let startDate: Date;
    const aggregatedData: { label: string; income: number; expense: number }[] =
      [];

    const toDate = (v: string | Date) => (v instanceof Date ? v : new Date(v));
    const getDateKey = (v: string | Date) =>
      toDate(v).toISOString().split("T")[0];

    if (selectedFilter.startsWith("month-")) {
      const monthIndex = parseInt(selectedFilter.split("-")[1]);
      const year = now.getFullYear();

      startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0);

      const dailyData: Record<string, { income: number; expense: number }> = {};
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        dailyData[getDateKey(new Date(d))] = { income: 0, expense: 0 };
      }

      incomes.forEach((inc) => {
        const incDate = new Date(inc.date);
        if (
          incDate.getMonth() === monthIndex &&
          incDate.getFullYear() === year
        ) {
          const key = getDateKey(incDate);
          if (dailyData[key]) dailyData[key].income += inc.amount;
        }
      });

      expenses.forEach((exp) => {
        const expDate = new Date(exp.date);
        if (
          expDate.getMonth() === monthIndex &&
          expDate.getFullYear() === year
        ) {
          const key = getDateKey(expDate);
          if (dailyData[key]) dailyData[key].expense += exp.amount;
        }
      });

      const sortedDates = Object.keys(dailyData).sort();
      const weekSize = 7;

      for (let i = 0; i < sortedDates.length; i += weekSize) {
        const weekDates = sortedDates.slice(i, i + weekSize);
        const weekIncome = weekDates.reduce(
          (sum, d) => sum + dailyData[d].income,
          0,
        );
        const weekExpense = weekDates.reduce(
          (sum, d) => sum + dailyData[d].expense,
          0,
        );
        const weekNumber = Math.floor(i / weekSize) + 1;

        aggregatedData.push({
          label: `W${weekNumber}`,
          income: weekIncome,
          expense: weekExpense,
        });
      }
    } else if (selectedFilter === "alltime") {
      const MAX_POINTS = 10;

      const allDates = [
        ...incomes.map((inc) => new Date(inc.date)),
        ...expenses.map((exp) => new Date(exp.date)),
      ];

      if (allDates.length === 0) return [];

      const earliestDate = new Date(
        Math.min(...allDates.map((d) => d.getTime())),
      );
      const latestDate = new Date(
        Math.max(...allDates.map((d) => d.getTime())),
      );

      const totalDays = Math.ceil(
        (latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (totalDays === 0) {
        const dailyData: Record<string, { income: number; expense: number }> =
          {};
        const key = getDateKey(earliestDate);
        dailyData[key] = { income: 0, expense: 0 };

        incomes.forEach((inc) => {
          const incKey = getDateKey(new Date(inc.date));
          if (dailyData[incKey]) dailyData[incKey].income += inc.amount;
        });

        expenses.forEach((exp) => {
          const expKey = getDateKey(new Date(exp.date));
          if (dailyData[expKey]) dailyData[expKey].expense += exp.amount;
        });

        aggregatedData.push({
          label: earliestDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          income: dailyData[key].income,
          expense: dailyData[key].expense,
        });
      } else {
        const chunkSizeDays = Math.ceil(totalDays / MAX_POINTS);

        const dailyData: Record<string, { income: number; expense: number }> =
          {};
        for (
          let d = new Date(earliestDate);
          d <= latestDate;
          d.setDate(d.getDate() + 1)
        ) {
          dailyData[getDateKey(new Date(d))] = { income: 0, expense: 0 };
        }

        incomes.forEach((inc) => {
          const key = getDateKey(new Date(inc.date));
          if (dailyData[key]) dailyData[key].income += inc.amount;
        });

        expenses.forEach((exp) => {
          const key = getDateKey(new Date(exp.date));
          if (dailyData[key]) dailyData[key].expense += exp.amount;
        });

        const sortedDates = Object.keys(dailyData).sort();

        for (let i = 0; i < sortedDates.length; i += chunkSizeDays) {
          const chunkDates = sortedDates.slice(i, i + chunkSizeDays);
          const chunkIncome = chunkDates.reduce(
            (sum, d) => sum + dailyData[d].income,
            0,
          );
          const chunkExpense = chunkDates.reduce(
            (sum, d) => sum + dailyData[d].expense,
            0,
          );

          const chunkStartDate = new Date(chunkDates[0]);

          let label: string;
          if (totalDays > 365) {
            label = chunkStartDate.toLocaleDateString("en-US", {
              month: "short",
              year: "2-digit",
            });
          } else {
            label = chunkStartDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          }

          aggregatedData.push({
            label,
            income: chunkIncome,
            expense: chunkExpense,
          });
        }
      }
    }

    return aggregatedData;
  }, [incomes, expenses, selectedFilter]);

  const {
    yAxisMax,
    yAxisLabels,
    incomePath,
    expensePath,
    incomeArea,
    expenseArea,
    incomePoints,
    expensePoints,
  } = useMemo(() => {
    // Guard: return empty/safe defaults when there's no chart data
    if (chartData.length === 0) {
      return {
        yAxisMax: 0,
        yAxisLabels: [],
        incomePath: "",
        expensePath: "",
        incomeArea: "",
        expenseArea: "",
        incomePoints: [],
        expensePoints: [],
      };
    }

    const incomeValues = chartData.map((d) => d.income);
    const expenseValues = chartData.map((d) => d.expense);

    const maxIncome = Math.max(...incomeValues, 0);
    const maxExpense = Math.max(...expenseValues, 0);
    const actualMax = Math.max(maxIncome, maxExpense);

    const MIN_CHART_MAX = 40000;
    const STEP = 10000;
    const yAxisMax = Math.max(
      Math.ceil(actualMax / STEP) * STEP,
      MIN_CHART_MAX,
    );

    const segments = 4;
    const yAxisLabels = [];

    for (let i = 0; i <= segments; i++) {
      const value = (yAxisMax / segments) * i;
      const label = formatYAxisLabel(value);
      const yPos = plotHeight + paddingTop - i * (plotHeight / segments);
      yAxisLabels.push({ value, label, y: yPos });
    }

    const getY = (value: number) => {
      const ratio = value / yAxisMax;
      return paddingTop + plotHeight - ratio * plotHeight;
    };

    const getX = (index: number) => {
      if (chartData.length === 1) return paddingLeft + plotWidth / 2;
      const spacing = plotWidth / (chartData.length - 1);
      return paddingLeft + index * spacing;
    };

    let incomePath = "";
    let incomeArea = "";
    const incomePoints: { x: number; y: number }[] = [];

    chartData.forEach((data, index) => {
      const x = getX(index);
      const y = getY(data.income);
      incomePoints.push({ x, y });

      if (index === 0) {
        incomePath += `M ${x} ${y}`;
        incomeArea += `M ${x} ${plotHeight + paddingTop} L ${x} ${y}`;
      } else {
        incomePath += ` L ${x} ${y}`;
        incomeArea += ` L ${x} ${y}`;
      }
    });
    incomeArea += ` L ${getX(chartData.length - 1)} ${plotHeight + paddingTop} Z`;

    let expensePath = "";
    let expenseArea = "";
    const expensePoints: { x: number; y: number }[] = [];

    chartData.forEach((data, index) => {
      const x = getX(index);
      const y = getY(data.expense);
      expensePoints.push({ x, y });

      if (index === 0) {
        expensePath += `M ${x} ${y}`;
        expenseArea += `M ${x} ${plotHeight + paddingTop} L ${x} ${y}`;
      } else {
        expensePath += ` L ${x} ${y}`;
        expenseArea += ` L ${x} ${y}`;
      }
    });
    expenseArea += ` L ${getX(chartData.length - 1)} ${plotHeight + paddingTop} Z`;

    return {
      yAxisMax,
      yAxisLabels,
      incomePath,
      expensePath,
      incomeArea,
      expenseArea,
      incomePoints,
      expensePoints,
    };
  }, [chartData, plotWidth, plotHeight, paddingLeft, paddingTop]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Income vs Expenses</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterDropdown(!showFilterDropdown)}
        >
          <Text style={styles.filterText}>
            {FILTER_OPTIONS.find((f) => f.value === selectedFilter)?.label}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {showFilterDropdown && (
        <ScrollView
          style={styles.dropdown}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          {FILTER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedFilter(option.value);
                setShowFilterDropdown(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownText,
                  selectedFilter === option.value &&
                    styles.selectedDropdownText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.chartContainer}>
        <View style={styles.yAxisLabels}>
          {[...yAxisLabels].reverse().map((label, index) => (
            <Text key={index} style={styles.yAxisLabel}>
              {label.label}
            </Text>
          ))}
        </View>

        <View style={{ flex: 1 }}>
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <LinearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="70%" stopColor="white" />
                <Stop offset="0%" stopColor="rgba(86, 202, 0, 0.1)" />
              </LinearGradient>
              <LinearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="70%" stopColor="white" />
                <Stop offset="0%" stopColor="rgba(22, 177, 255, 0.7)" />
              </LinearGradient>
            </Defs>

            {yAxisLabels.map((label, index) => (
              <Line
                key={index}
                x1={paddingLeft}
                y1={label.y}
                x2={chartWidth - paddingRight}
                y2={label.y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}

            <Path d={incomeArea} fill="url(#incomeGradient)" />
            <Path d={expenseArea} fill="url(#expenseGradient)" />

            <Path
              d={incomePath}
              stroke="rgba(0, 166, 62, 0.7)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d={expensePath}
              stroke="rgba(231, 0, 11, 0.7)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {incomePoints.map((point, index) => (
              <Circle
                key={`income-${index}`}
                cx={point.x}
                cy={point.y}
                r="5"
                fill="white"
                stroke="rgba(0, 166, 62, 1)"
                strokeWidth="3"
              />
            ))}
            {expensePoints.map((point, index) => (
              <Circle
                key={`expense-${index}`}
                cx={point.x}
                cy={point.y}
                r="5"
                fill="white"
                stroke="rgba(231, 0, 11, 0.5)"
                strokeWidth="3"
              />
            ))}
          </Svg>
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#22c55e" }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
          <Text style={styles.legendText}>Expenses</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing(16),
  },
  title: {
    fontSize: scaleFontSize(16),
    fontFamily: "semibold",
    color: "#000",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(4),
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(6),
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  filterText: {
    fontSize: scaleFontSize(14),
    fontFamily: "regular",
    color: "#666",
  },
  dropdownWrapper: {},
  dropdown: {
    position: "absolute",
    top: 60,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    maxHeight: 250,
    width: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: "medium",
    color: "#666",
  },
  selectedDropdownText: {
    color: "#22c55e",
  },
  chartContainer: {
    flexDirection: "row",
    marginVertical: spacing(8),
  },
  yAxisLabels: {
    justifyContent: "space-between",
    paddingTop: spacing(20),
    paddingBottom: spacing(55),
  },
  yAxisLabel: {
    fontSize: scaleFontSize(12),
    color: "#999",
    textAlign: "right",
  },
  xAxisLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: spacing(20),
    paddingTop: spacing(8),
  },
  xAxisLabel: {
    fontSize: scaleFontSize(12),
    fontFamily: "medium",
    color: "#999",
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(24),
    paddingHorizontal: spacing(20),
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(8),
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: scaleFontSize(14),
    fontFamily: "medium",
    color: "#666",
  },
});

export default IncomeExpenseChart;
