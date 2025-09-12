import LoaderProvider from "@/context/LoaderContext";
import "../global.css";
import { AuthProvider } from "@/context/AuthContext";
import { Slot } from "expo-router";

const RootLayout = () => {
  return (
    <LoaderProvider>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </LoaderProvider>
  );
};

export default RootLayout;
