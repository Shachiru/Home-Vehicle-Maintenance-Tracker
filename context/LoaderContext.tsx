import { View, Text } from "react-native";
import React, { createContext, ReactNode, useState } from "react";
import Loader from "@/components/Loader";

interface LoaderContextType {
  showLoader: () => void;
  hideLoader: () => void;
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export const LoaderProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);

  const showLoader = () => setVisible(true);
  const hideLoader = () => setVisible(false);

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader }}>
      {children}
      <Loader visible={visible} />
    </LoaderContext.Provider>
  );
};

export default LoaderProvider;
