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
  <LoaderProvider>
    <AuthProvider>
      <ThemeProvider>
        <LayoutWithLoader />
      </ThemeProvider>
    </AuthProvider>
  </LoaderProvider>
);

export default RootLayout;
