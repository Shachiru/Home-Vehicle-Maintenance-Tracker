import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "@/context/ThemeContext";

type StylesFunction<T> = (isDark: boolean) => T;

export function useThemedStyles<T>(createStyles: StylesFunction<T>): T {
  const { isDark } = useTheme();

  // Memoize the styles to prevent unnecessary re-renders
  return useMemo(() => createStyles(isDark), [isDark, createStyles]);
}
