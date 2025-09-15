import { ThemeType } from "@/context/ThemeContext";

// Define your color palette
export const colors = {
  primary: {
    light: "#3b82f6", // blue-500
    dark: "#60a5fa", // blue-400
  },
  background: {
    light: "#f9fafb", // gray-50
    dark: "#111827", // gray-900
  },
  card: {
    light: "#ffffff", // white
    dark: "#1f2937", // gray-800
  },
  text: {
    primary: {
      light: "#111827", // gray-900
      dark: "#f9fafb", // gray-50
    },
    secondary: {
      light: "#4b5563", // gray-600
      dark: "#9ca3af", // gray-400
    },
    tertiary: {
      light: "#6b7280", // gray-500
      dark: "#6b7280", // gray-500
    },
  },
  border: {
    light: "#e5e7eb", // gray-200
    dark: "#374151", // gray-700
  },
  button: {
    primary: {
      light: "#3b82f6", // blue-500
      dark: "#3b82f6", // blue-500
    },
    secondary: {
      light: "#e5e7eb", // gray-200
      dark: "#374151", // gray-700
    },
  },
};

// Helper function to get color based on theme
export const getColor = (colorKey: string, theme: ThemeType) => {
  const keys = colorKey.split(".");
  let colorObj: any = colors;

  for (const key of keys) {
    if (colorObj[key]) {
      colorObj = colorObj[key];
    } else {
      return undefined;
    }
  }

  return colorObj[theme] || colorObj;
};
