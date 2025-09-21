import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define theme types
export type ThemeType = "light" | "dark";

// Define the context type
type ThemeContextType = {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  isLoading: boolean;
};

// Create the context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
  isLoading: false,
});

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeType>("light");
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef(false);
  const toggleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved theme on component mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme");
        if (savedTheme === "dark" || savedTheme === "light") {
          setThemeState(savedTheme);
        }
      } catch (error) {
        console.error("Failed to load theme preference:", error);
      } finally {
        isInitialized.current = true;
      }
    };

    loadTheme();
  }, []);

  // Save theme whenever it changes (but not on initial load)
  useEffect(() => {
    if (isInitialized.current) {
      const saveTheme = async () => {
        try {
          await AsyncStorage.setItem("theme", theme);
        } catch (error) {
          console.error("Failed to save theme preference:", error);
        }
      };

      saveTheme();
    }
  }, [theme]);

  // Debounced theme toggle to prevent rapid switches
  const toggleTheme = useCallback(() => {
    if (isLoading) return; // Prevent multiple rapid toggles

    // Clear any existing timeout
    if (toggleTimeout.current) {
      clearTimeout(toggleTimeout.current);
    }

    setIsLoading(true);

    // Use a longer timeout to ensure smooth transition
    toggleTimeout.current = setTimeout(() => {
      setThemeState((prev) => (prev === "light" ? "dark" : "light"));

      // Keep loading state for a bit longer to ensure CSS changes are applied
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }, 100);
  }, [isLoading]);

  // Set theme directly with debouncing
  const setTheme = useCallback(
    (newTheme: ThemeType) => {
      if (newTheme !== theme && !isLoading) {
        setIsLoading(true);

        setTimeout(() => {
          setThemeState(newTheme);
          setTimeout(() => {
            setIsLoading(false);
          }, 300);
        }, 100);
      }
    },
    [theme, isLoading]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toggleTimeout.current) {
        clearTimeout(toggleTimeout.current);
      }
    };
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        toggleTheme,
        setTheme,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);
