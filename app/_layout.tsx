import "../global.css";
import { AuthProvider } from "@/context/AuthContext";
import { LoaderProvider, useLoader } from "@/context/LoaderContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Loader from "@/components/Loader";
import { Slot } from "expo-router";

const LayoutWithLoader = () => {
  const { loading } = useLoader();
  return (
    <>
      <Slot />
      <Loader visible={loading} />
    </>
  );
};

const RootLayout = () => (
  <ThemeProvider>
    <LoaderProvider>
      <AuthProvider>
        <LayoutWithLoader />
      </AuthProvider>
    </LoaderProvider>
  </ThemeProvider>
);

export default RootLayout;
