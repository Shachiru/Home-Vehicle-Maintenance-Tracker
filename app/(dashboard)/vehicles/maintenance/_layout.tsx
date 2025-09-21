import { Stack } from "expo-router";
import React from "react";

const MaintenanceLayout = () => {
  return (
    <Stack screenOptions={{ animation: "fade_from_bottom" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[vehicleId]/index" options={{ headerShown: false }} />
      <Stack.Screen
        name="task/new"
        options={{ title: "Add Maintenance Task" }}
      />
      <Stack.Screen name="task/[id]" options={{ title: "Maintenance Task" }} />
    </Stack>
  );
};

export default MaintenanceLayout;
