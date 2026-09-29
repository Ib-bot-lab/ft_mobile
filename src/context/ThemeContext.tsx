import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";

export type ThemeMode = "light" | "dark" | "system";
export type ActualTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "app-theme";

interface ThemeContextValue {
  theme: ThemeMode;
  actualTheme: ActualTheme;
  setTheme: (t: ThemeMode) => Promise<void>;
  isDark: boolean;
  isLight: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const resolveActual = (mode: ThemeMode): ActualTheme => {
  if (mode === "system") {
    return Appearance.getColorScheme() === "dark" ? "dark" : "light";
  }
  return mode;
};

/** Standalone hook — works with or without ThemeProvider.
 *  When used outside the provider it reads AsyncStorage directly. */
export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);

  // Inside provider — use it directly
  if (ctx) return ctx;

  // Outside provider — local state that reads from AsyncStorage
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [theme, setThemeState] = useState<ThemeMode>("system");

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((val) => {
      if (val === "light" || val === "dark" || val === "system") {
        setThemeState(val);
      }
    });
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const sub = Appearance.addChangeListener(() => {
      setThemeState((prev) => prev);
    });
    return () => sub.remove();
  }, []);

  const setTheme = async (t: ThemeMode) => {
    setThemeState(t);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, t);
  };

  const actualTheme = resolveActual(theme);
  return { theme, actualTheme, setTheme, isDark: actualTheme === "dark", isLight: actualTheme === "light" };
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeMode>("system");

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((val) => {
      if (val === "light" || val === "dark" || val === "system") {
        setThemeState(val);
      }
    });
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(() => {
      setThemeState((prev) => prev);
    });
    return () => sub.remove();
  }, []);

  const setTheme = async (t: ThemeMode) => {
    setThemeState(t);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, t);
  };

  const actualTheme = resolveActual(theme);

  return (
    <ThemeContext.Provider
      value={{ theme, actualTheme, setTheme, isDark: actualTheme === "dark", isLight: actualTheme === "light" }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
