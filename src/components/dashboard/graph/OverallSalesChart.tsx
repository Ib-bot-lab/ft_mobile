import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { scaleFontSize, spacing } from "@/src/utils/random";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

type TimeRange = "1W" | "1M" | "6M" | "1Y";

type Order = { id: string; price: number; orderDate: string; status: string };
type Income = { id: string; amount: number; date: string };
type Props = { orders: Order[]; income: Income[] };
type PeriodData = { label: string; currentYear: number; lastYear: number };

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const getComparisonLabel = (range: TimeRange): string => {
  switch (range) {
    case "1W": return "vs last Week";
    case "1M": return "vs last Month";
    case "6M": return "vs last 6 Months";
    case "1Y": return "vs last Year";
  }
};

const getCurrentPeriodLabel = (range: TimeRange): string => {
  switch (range) {
    case "1W": return "This Week";
    case "1M": return "This Month";
    case "6M": return "Last 6 Months";
    case "1Y": return "This Year";
  }
};

const getLastPeriodLabel = (range: TimeRange): string => {
  switch (range) {
    case "1W": return "Last Week";
    case "1M": return "Last Month";
    case "6M": return "Previous 6 Months";
    case "1Y": return "Last Year";
  }
};

export const OverallSalesChart: React.FC<Props> = ({ orders, income }) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("1Y");
  const { isDark } = useTheme();

  const textColor = isDark ? Colors.text.white : "black";
  const subTextColor = isDark ? "rgba(160,160,160,1)" : Colors.black50;
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  const rangeInactiveBg = isDark ? "rgba(255,255,255,0.08)" : "#F3F4F6";
  const rangeInactiveText = isDark ? "rgba(200,200,200,1)" : Colors.text.black;

  const chartData = useMemo((): PeriodData[] => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;

    const allTransactions = [
      ...orders.map((o) => ({ amount: o.price, date: o.orderDate })),
      ...income.map((i) => ({ amount: i.amount, date: i.date })),
    ];

    let periodsToShow: PeriodData[] = [];

    switch (selectedRange) {
      case "1W": {
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        for (let i = 0; i < 7; i++) {
          const d = new Date(startDate);
          d.setDate(startDate.getDate() + i);
          periodsToShow.push({ label: `${d.getDate()}`, currentYear: 0, lastYear: 0 });
        }
        allTransactions.forEach((t) => {
          const date = new Date(t.date);
          const year = date.getFullYear();
          if (year === currentYear) {
            const diff = Math.floor((date.getTime() - startDate.getTime()) / 86400000);
            if (diff >= 0 && diff < 7) periodsToShow[diff].currentYear += t.amount;
          } else if (year === lastYear) {
            const lyStart = new Date(startDate);
            lyStart.setFullYear(lastYear);
            const diff = Math.floor((date.getTime() - lyStart.getTime()) / 86400000);
            if (diff >= 0 && diff < 7) periodsToShow[diff].lastYear += t.amount;
          }
        });
        break;
      }
      case "1M": {
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - 27);
        for (let i = 0; i < 4; i++) {
          periodsToShow.push({ label: `W${i + 1}`, currentYear: 0, lastYear: 0 });
        }
        allTransactions.forEach((t) => {
          const date = new Date(t.date);
          const year = date.getFullYear();
          if (year === currentYear) {
            const diff = Math.floor((date.getTime() - startDate.getTime()) / 86400000);
            const wi = Math.floor(diff / 7);
            if (wi >= 0 && wi < 4) periodsToShow[wi].currentYear += t.amount;
          } else if (year === lastYear) {
            const ly = new Date(startDate);
            ly.setFullYear(lastYear);
            const diff = Math.floor((date.getTime() - ly.getTime()) / 86400000);
            const wi = Math.floor(diff / 7);
            if (wi >= 0 && wi < 4) periodsToShow[wi].lastYear += t.amount;
          }
        });
        break;
      }
      case "6M": {
        const cm = now.getMonth();
        const sm = cm - 5;
        for (let i = 0; i < 6; i++) {
          periodsToShow.push({ label: MONTHS[(sm + i + 12) % 12], currentYear: 0, lastYear: 0 });
        }
        allTransactions.forEach((t) => {
          const date = new Date(t.date);
          const year = date.getFullYear();
          const month = date.getMonth();
          let ma = (cm - month + 12) % 12;
          if (ma > 6) ma = 12 - ma;
          if (year === currentYear && ma <= 5) {
            const idx = 5 - ma;
            if (idx >= 0 && idx < 6) periodsToShow[idx].currentYear += t.amount;
          } else if (year === lastYear && ma <= 5) {
            const idx = 5 - ma;
            if (idx >= 0 && idx < 6) periodsToShow[idx].lastYear += t.amount;
          }
        });
        break;
      }
      case "1Y": {
        periodsToShow = MONTHS.map((m) => ({ label: m, currentYear: 0, lastYear: 0 }));
        allTransactions.forEach((t) => {
          const date = new Date(t.date);
          const year = date.getFullYear();
          const month = date.getMonth();
          if (year === currentYear) periodsToShow[month].currentYear += t.amount;
          else if (year === lastYear) periodsToShow[month].lastYear += t.amount;
        });
        break;
      }
    }

    return periodsToShow;
  }, [orders, income, selectedRange]);

  const percentageChange = useMemo(() => {
    const ct = chartData.reduce((s, d) => s + d.currentYear, 0);
    const lt = chartData.reduce((s, d) => s + d.lastYear, 0);
    if (lt === 0) return ct > 0 ? 100 : 0;
    return ((ct - lt) / lt) * 100;
  }, [chartData]);

  const maxValue = useMemo(() => {
    const all = chartData.flatMap((d) => [d.currentYear, d.lastYear]);
    const max = Math.max(...all, 1);
    const mag = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / mag) * mag;
  }, [chartData]);

  const { yAxisLabels, actualMaxValue } = useMemo(() => {
    const fmt = (val: number): string => {
      if (val === 0) return "\u20a60";
      if (val >= 1000000) {
        const m = val / 1000000;
        return m % 1 === 0 ? `\u20a6${m}M` : `\u20a6${m.toFixed(1)}M`;
      }
      if (val >= 1000) {
        const k = val / 1000;
        return k % 1 === 0 ? `\u20a6${k}K` : `\u20a6${k.toFixed(0)}K`;
      }
      return `\u20a6${val}`;
    };

    let step: number;
    if (selectedRange === "1W") {
      step = maxValue >= 10000 ? 5000 : maxValue >= 1000 ? 1000 : maxValue >= 500 ? 200 : maxValue >= 100 ? 50 : 10;
    } else if (selectedRange === "1M") {
      step = maxValue >= 50000 ? 20000 : maxValue >= 10000 ? 5000 : maxValue >= 5000 ? 2000 : maxValue >= 1000 ? 500 : 100;
    } else if (selectedRange === "6M") {
      step = maxValue >= 1000000 ? 500000 : maxValue >= 500000 ? 200000 : maxValue >= 100000 ? 50000 : maxValue >= 50000 ? 20000 : maxValue >= 10000 ? 5000 : 1000;
    } else {
      step = maxValue >= 10000000 ? 2000000 : maxValue >= 5000000 ? 1000000 : maxValue >= 1000000 ? 500000 : maxValue >= 500000 ? 200000 : maxValue >= 100000 ? 50000 : 10000;
    }

    const adj = Math.ceil(maxValue / step) * step;
    return {
      yAxisLabels: [adj, Math.round((adj * 2) / 3), Math.round(adj / 3), 0].map(fmt),
      actualMaxValue: adj,
    };
  }, [maxValue, selectedRange]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: textColor }]}>Overall Sales</Text>
            <View style={styles.changeContainer}>
              <Text style={[styles.changeIcon, percentageChange >= 0 && styles.positive]}>
                {percentageChange >= 0 ? "\u2191" : "\u2193"}
              </Text>
              <Text style={[styles.changeText, { color: subTextColor }, percentageChange >= 0 && styles.positive]}>
                {Math.abs(percentageChange).toFixed(1)}% {getComparisonLabel(selectedRange)}
              </Text>
            </View>
          </View>

          <View style={styles.timeRangeButtons}>
            {(["1W", "1M", "6M", "1Y"] as TimeRange[]).map((range) => (
              <TouchableOpacity
                key={range}
                onPress={() => setSelectedRange(range)}
                style={[styles.rangeButton, { backgroundColor: selectedRange === range ? "#4B5563" : rangeInactiveBg }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.rangeButtonText, { color: selectedRange === range ? "#FFFFFF" : rangeInactiveText }]}>
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.lastYearColor]} />
            <Text style={[styles.legendText, { color: subTextColor }]}>{getLastPeriodLabel(selectedRange)}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.runningYearColor]} />
            <Text style={[styles.legendText, { color: subTextColor }]}>{getCurrentPeriodLabel(selectedRange)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.yAxis}>
          {yAxisLabels.map((label, i) => (
            <Text key={i} style={[styles.yAxisLabel, { color: subTextColor }]}>{label}</Text>
          ))}
        </View>

        <View style={styles.chartContent}>
          <View style={styles.gridLines}>
            {yAxisLabels.map((_, i) => (
              <View key={i} style={[styles.gridLine, { backgroundColor: gridColor }]} />
            ))}
          </View>

          <View style={styles.barsContainer}>
            {chartData.map((data, index) => (
              <View key={`${data.label}-${index}`} style={styles.barGroup}>
                <AnimatedBar value={data.lastYear} maxValue={actualMaxValue} color="rgba(24, 144, 139, 0.5)" delay={index * 30} />
                <AnimatedBar value={data.currentYear} maxValue={actualMaxValue} color="rgba(22, 152, 141, 1)" delay={index * 30 + 15} />
              </View>
            ))}
          </View>

          <View style={styles.xAxis}>
            {chartData.map((data, index) => (
              <Text key={`${data.label}-${index}`} style={[styles.xAxisLabel, { color: subTextColor }]}>{data.label}</Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

type AnimatedBarProps = { value: number; maxValue: number; color: string; delay: number };

const AnimatedBar: React.FC<AnimatedBarProps> = ({ value, maxValue, color, delay }) => {
  const height = useSharedValue(0);
  const CHART_HEIGHT = 200;

  React.useEffect(() => {
    const target = maxValue > 0 ? (value / maxValue) * CHART_HEIGHT : 0;
    height.value = withDelay(delay, withTiming(target, { duration: 600 }));
  }, [value, maxValue, delay, height]);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));

  if (value === 0) {
    return <View style={[styles.bar, { height: 2, backgroundColor: color, opacity: 0.3 }]} />;
  }
  return <Animated.View style={[styles.bar, { backgroundColor: color }, animatedStyle]} />;
};

const styles = StyleSheet.create({
  container: { flex: 1, marginVertical: spacing(8) },
  header: { marginBottom: 24, gap: 16 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: scaleFontSize(15), fontFamily: "medium" },
  changeContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  changeIcon: { fontFamily: "regular", fontSize: scaleFontSize(10), color: "#EF4444" },
  changeText: { fontFamily: "regular", fontSize: scaleFontSize(10) },
  positive: { color: Colors.primary },
  legend: { flexDirection: "row", gap: 20 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  lastYearColor: { backgroundColor: "rgba(24, 144, 139, 0.5)" },
  runningYearColor: { backgroundColor: "rgba(22, 152, 141, 1)" },
  legendText: { fontFamily: "regular", fontSize: scaleFontSize(12) },
  timeRangeButtons: { flexDirection: "row", gap: 6 },
  rangeButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  rangeButtonText: { fontFamily: "regular", fontSize: scaleFontSize(10) },
  chartContainer: { flexDirection: "row", width: "100%" },
  yAxis: { width: 50, justifyContent: "space-between", height: 200, paddingRight: 8 },
  yAxisLabel: { fontFamily: "medium", fontSize: scaleFontSize(10), textAlign: "right" },
  chartContent: { flex: 1 },
  gridLines: { position: "absolute", left: 0, right: 0, height: 200, justifyContent: "space-between" },
  gridLine: { height: 1, opacity: 0.5 },
  barsContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 200, paddingHorizontal: 2 },
  barGroup: { flexDirection: "row", alignItems: "flex-end", gap: 2, flex: 1, justifyContent: "center" },
  bar: { width: 8, borderRadius: 3, minHeight: 2 },
  xAxis: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingHorizontal: 2 },
  xAxisLabel: { fontFamily: "medium", fontSize: scaleFontSize(10), flex: 1, textAlign: "center" },
});

export default OverallSalesChart;
