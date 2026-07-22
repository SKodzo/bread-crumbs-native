import { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

export const lightColors = {
  // Brand
  green:"#1B6B44", greenMid:"#4A9B6F", greenLight:"#E8F5EE", greenPale:"#F2FAF6",
  amber:"#E8A020", amberLight:"#FEF3DC",
  red:"#DC2626", redLight:"#FEE2E2",
  blue:"#1D4ED8", blueLight:"#DBEAFE",
  // UI
  bg:"#F5F5F0",
  card:"#FFFFFF",
  header:"#FFFFFF",
  charcoal:"#2C2C2C",
  text:"#2C2C2C",
  textSub:"#4B5563",
  gray700:"#4B5563", gray500:"#6B7280", gray400:"#9CA3AF", gray300:"#D1D5DB", gray200:"#E5E7EB", gray100:"#F3F4F6",
  border:"#E5E7EB",
  white:"#FFFFFF",
  cream:"#FBF8F3",
};

export const darkColors = {
  // Brand — keep greens vibrant
  green:"#2D9B63", greenMid:"#4A9B6F", greenLight:"#0D2E1E", greenPale:"#0A1F15",
  amber:"#F59E0B", amberLight:"#2D1F00",
  red:"#EF4444", redLight:"#2D0A0A",
  blue:"#60A5FA", blueLight:"#0D1A35",
  // UI
  bg:"#0F0F0F",
  card:"#1C1C1E",
  header:"#1C1C1E",
  charcoal:"#F2F2F7",
  text:"#F2F2F7",
  textSub:"#AEAEB2",
  gray700:"#AEAEB2", gray500:"#8E8E93", gray400:"#636366", gray300:"#3A3A3C", gray200:"#48484A", gray100:"#2C2C2E",
  border:"#3A3A3C",
  white:"#FFFFFF",
  cream:"#1C1C1E",
};

const STORAGE_KEY = "theme_mode"; // "light" | "dark" | "system"

// Context carries the resolved palette plus the mode controls. Default is a
// safe light-mode shape so anything rendered before the provider mounts still works.
export const ThemeContext = createContext({
  colors: lightColors,
  mode: "system",
  resolved: "light",
  setMode: () => {},
});

function resolveColors(mode, systemScheme) {
  const active = mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;
  return { colors: active === "dark" ? darkColors : lightColors, resolved: active };
}

/**
 * Wraps the app and owns the active theme. Holds the user's choice
 * (light / dark / system), persists it to SecureStore, and resolves it against
 * the OS setting when in "system" mode.
 *
 * `onHydrated` fires once the saved choice has loaded so the caller can avoid a
 * light→dark flash on cold start.
 */
export function ThemeProvider({ children, onHydrated }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState("system");

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(STORAGE_KEY);
        if (saved === "light" || saved === "dark" || saved === "system") {
          setModeState(saved);
        }
      } catch (_) {}
      onHydrated && onHydrated();
    })();
  }, []);

  const setMode = (next) => {
    setModeState(next);
    SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {});
  };

  const { colors, resolved } = resolveColors(mode, systemScheme);

  return (
    <ThemeContext.Provider value={{ colors, mode, resolved, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Returns the active color palette. Backed by the provider so a manual
// light/dark switch updates every screen at once.
export function useTheme() {
  return useContext(ThemeContext).colors;
}

export function useThemeColors() {
  return useContext(ThemeContext).colors;
}

// For the appearance toggle: current mode, the resolved scheme, and the setter.
export function useThemeMode() {
  const { mode, resolved, setMode } = useContext(ThemeContext);
  return { mode, resolved, setMode };
}
