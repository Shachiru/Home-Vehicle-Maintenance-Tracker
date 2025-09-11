import { View, Text } from "react-native";
import React from "react";
import { useRouter } from "expo-router";

const Index = () => {
  const router = useRouter();
  return (
    <View>
      <Text>Index</Text>
    </View>
  );
};

export default Index;
