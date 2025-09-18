import React from "react";
import { View, Text, ActivityIndicator } from "react-native";

interface LoaderProps {
  visible: boolean;
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ visible, text = "Loading..." }) => {
  if (!visible) return null;
};

export default Loader;
