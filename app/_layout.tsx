import "../global.css";
import { AuthProvider } from "@/context/AuthContext";
import { LoaderProvider } from "@/context/LoaderContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Slot } from "expo-router";

const RootLayout = () => {
  return (
    <LoaderProvider>
      <AuthProvider>
        <ThemeProvider>
          <Slot />
        </ThemeProvider>
      </AuthProvider>
    </LoaderProvider>
  );
};

export default RootLayout;
