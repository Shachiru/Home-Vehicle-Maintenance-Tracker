import { View, Text, ActivityIndicator, SafeAreaView } from "react-native";
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Tabs, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View>
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#2ecc71",
          tabBarInactiveTintColor: "#2c3e50",
          tabBarStyle: {
            backgroundColor: "#bdc3c7",
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
          name="tasks"
          options={{
            title: "Task",
            tabBarIcon: (data) => (
              <MaterialIcons
                name="check-circle"
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
