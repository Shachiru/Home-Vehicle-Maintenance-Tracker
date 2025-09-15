import { View, Text, ActivityIndicator, SafeAreaView } from "react-native";
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Tabs, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View
        className={`flex-1 justify-center items-center ${
          isDark ? "bg-gray-900" : "bg-white"
        }`}
      >
        <ActivityIndicator
          color={isDark ? "#60a5fa" : "#3b82f6"}
          size="large"
        />
        <Text className={`mt-4 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-gray-900" : "bg-white"}`}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: isDark ? "#60a5fa" : "#3b82f6", // Blue color for both themes but slightly different shades
          tabBarInactiveTintColor: isDark ? "#9ca3af" : "#6b7280", // Gray color, lighter for dark mode
          tabBarStyle: {
            backgroundColor: isDark ? "#1f2937" : "#ffffff", // Dark gray for dark mode, white for light mode
            borderTopColor: isDark ? "#374151" : "#e5e7eb", // Border color
            borderTopWidth: 1,
            elevation: 0,
            shadowOpacity: 0.1,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
            marginBottom: 4,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: (data) => (
              <MaterialIcons
                name="home-filled"
                size={data.size}
                color={data.color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="vehicles"
          options={{
            title: "Vehicles",
            tabBarIcon: (data) => (
              <MaterialIcons
                name="directions-car"
                size={data.size}
                color={data.color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: (data) => (
              <MaterialIcons
                name="person"
                size={data.size}
                color={data.color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="setting"
          options={{
            title: "Setting",
            tabBarIcon: (data) => (
              <MaterialIcons
                name="settings"
                size={data.size}
                color={data.color}
              />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
};

export default DashboardLayout;
