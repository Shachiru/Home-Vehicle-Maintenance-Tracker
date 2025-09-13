import { Stack } from "expo-router";
import React from "react";

const VehicleLayout = () => {
  return (
    <Stack screenOptions={{ animation: "fade_from_bottom" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: "Vehicle Form" }} />
      <Stack.Screen name="maintenance" options={{ headerShown: false }} />
    </Stack>
  );
};

export default VehicleLayout;
