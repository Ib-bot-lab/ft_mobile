import PrimaryButton from "@/src/components/button/PrimaryButton";
import { HapticTab } from "@/src/components/haptic-tab";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { scale, scaleFontSize, spacing } from "@/src/utils/random";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Moon, Sun } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Line, Rect } from "react-native-svg";

const THEME_STORAGE_KEY = "app-theme";

type ThemeOption = "light" | "dark" | "system";

const themeOptions: {
  key: ThemeOption;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "light",
    label: "Light",
    icon: <Sun size={scale(24)} color={Colors.primary} />,
  },
  {
    key: "dark",
    label: "Dark",
    icon: <Moon size={scale(24)} color={Colors.primary} />,
  },
  {
    key: "system",
    label: "System",
    icon: (
      <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
        <Rect
          x="2" y="3" width="20" height="14" rx="2"
          stroke={Colors.primary} strokeWidth="2"
        />
        <Line x1="8" y1="21" x2="16" y2="21" stroke={Colors.primary} strokeWidth="2" />
        <Line x1="12" y1="17" x2="12" y2="21" stroke={Colors.primary} strokeWidth="2" />
      </Svg>
    ),
  },
];

const AppearanceDetailsScreen = () => {
  const [selected, setSelected] = useState<ThemeOption>("system");
  const [saving, setSaving] = useState(false);
  const { isDark } = useTheme();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : "rgba(54, 65, 83, 1)";
  const subTextColor = isDark ? "rgba(160,160,160,1)" : "rgba(54, 65, 83, 1)";
  const sectionTitleColor = isDark ? Colors.text.white : Colors.text.black;
  const hintColor = isDark ? "rgba(120,120,120,1)" : Colors.grayText;
  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(249,250,251,1)";
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : Colors.inputBorder;
  const cardSelectedBg = isDark ? "rgba(22,152,141,0.15)" : Colors.plight;
  const iconBoxBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(249,250,251,1)";
  const iconBoxSelectedBg = isDark ? "rgba(255,255,255,0.12)" : "white";

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((val) => {
      if (val === "light" || val === "dark" || val === "system") {
        setSelected(val);
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, selected);
      router.replace("/(tabs)/More");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={["left","right","bottom"]} style={{ flex: 1, paddingTop: spacing(20), backgroundColor: bg }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <HapticTab
          style={{ width: 32, aspectRatio: 1, justifyContent: "center", alignItems: "center" }}
          onPress={() => router.replace("/(tabs)/More")}
        >
          <ChevronLeft size={scale(20)} color={isDark ? "rgba(200,200,200,1)" : "rgba(54, 65, 83, 1)"} strokeWidth={1.5} />
        </HapticTab>

        <View style={styles.col}>
          <Text style={[styles.reg24, { color: textColor }]}>Appearance</Text>
          <Text style={[Styles.reg14, { color: subTextColor }]}>
            Customize your experience
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingVertical: spacing(30) }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Theme</Text>

        <View style={styles.cardsRow}>
          {themeOptions.map((opt) => {
            const isSelected = selected === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setSelected(opt.key)}
                style={[
                  styles.card,
                  { backgroundColor: isSelected ? cardSelectedBg : cardBg, borderColor: isSelected ? Colors.primary : cardBorder },
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: isSelected ? iconBoxSelectedBg : iconBoxBg }]}>
                  {opt.icon}
                </View>
                <Text style={[styles.cardLabel, { color: isSelected ? Colors.primary : isDark ? "rgba(160,160,160,1)" : Colors.label }]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.hint, { color: hintColor }]}>
          Theme changes are saved and will persist across sessions.
        </Text>
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingBottom: spacing(24) }}>
        <PrimaryButton title="Save Settings" onPress={handleSave} loading={saving} />
      </View>
    </SafeAreaView>
  );
};

export default AppearanceDetailsScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: spacing(8),
    paddingHorizontal: 16,
    paddingVertical: spacing(6),
  },
  col: { gap: spacing(4) },
  reg24: {
    fontFamily: "regular",
    fontSize: scaleFontSize(24),
    lineHeight: 32,
  },
  sectionTitle: {
    fontFamily: "semibold",
    fontSize: scaleFontSize(16),
    marginBottom: spacing(16),
  },
  cardsRow: {
    flexDirection: "row",
    gap: spacing(12),
  },
  card: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: spacing(20),
    alignItems: "center",
    gap: spacing(10),
  },
  iconBox: {
    width: 48,
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardLabel: {
    fontFamily: "medium",
    fontSize: scaleFontSize(13),
    color: Colors.label,
  },
  hint: {
    marginTop: spacing(20),
    fontFamily: "regular",
    fontSize: scaleFontSize(13),
    color: Colors.grayText,
    lineHeight: 20,
  },
});
