import { View, Text } from "react-native";
import React from "react";

interface LoaderProps {
  visible: boolean;
}

const Loader: React.FC<LoaderProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <View>
      <Text>Loader</Text>
    </View>
  );
};

export default Loader;
