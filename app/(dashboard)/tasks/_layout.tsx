import { Stack } from "expo-router";
import React from "react";

const TaskLayout = () => {
  return (
    <Stack screenOptions={{ animation: "fade_from_bottom" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: "Task Form" }} />
    </Stack>
  );
};

export default TaskLayout;
