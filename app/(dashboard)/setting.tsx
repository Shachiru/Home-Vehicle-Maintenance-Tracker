import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signout } from "@/services/authService";

const SettingScreen = () => {
  const { user } = useAuth();
  const { theme, isDark, toggleTheme, isLoading: themeLoading } = useTheme();
  const router = useRouter();

  // App preferences
  const [measurementUnit, setMeasurementUnit] = useState("miles");
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [maintenanceReminders, setMaintenanceReminders] = useState(true);

  // Static app version info
  const appVersion = "1.0.0";
  const buildVersion = "1";

  // Load saved preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedUnit = await AsyncStorage.getItem("measurementUnit");
        if (savedUnit) setMeasurementUnit(savedUnit);

        const savedPushNotifs = await AsyncStorage.getItem("pushNotifications");
        if (savedPushNotifs) setPushNotifications(savedPushNotifs === "true");

        const savedEmailNotifs = await AsyncStorage.getItem(
          "emailNotifications"
        );
        if (savedEmailNotifs)
          setEmailNotifications(savedEmailNotifs === "true");

        const savedReminders = await AsyncStorage.getItem(
          "maintenanceReminders"
        );
        if (savedReminders) setMaintenanceReminders(savedReminders === "true");
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    };

    loadPreferences();
  }, []);

  // Save preferences when changed
  const savePreference = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  // Handle theme toggle with proper error handling and debouncing
  const handleThemeToggle = useCallback(async () => {
    if (themeLoading) return; // Prevent toggle during loading

    try {
      toggleTheme();
    } catch (error) {
      console.error("Error toggling theme:", error);
      Alert.alert("Error", "Failed to switch theme. Please try again.");
    }
  }, [toggleTheme, themeLoading]);

  // Toggle handlers with AsyncStorage persistence
  const toggleMeasurementUnit = () => {
    const newValue = measurementUnit === "miles" ? "kilometers" : "miles";
    setMeasurementUnit(newValue);
    savePreference("measurementUnit", newValue);
  };

  const togglePushNotifications = () => {
    const newValue = !pushNotifications;
    setPushNotifications(newValue);
    savePreference("pushNotifications", newValue.toString());
  };

  const toggleEmailNotifications = () => {
    const newValue = !emailNotifications;
    setEmailNotifications(newValue);
    savePreference("emailNotifications", newValue.toString());
  };

  const toggleMaintenanceReminders = () => {
    const newValue = !maintenanceReminders;
    setMaintenanceReminders(newValue);
    savePreference("maintenanceReminders", newValue.toString());
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signout();
            router.replace("/signin");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  // Handle data actions
  const handleExportData = () => {
    Alert.alert(
      "Export Data",
      "This will export all your vehicle and maintenance data as a file. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export",
          onPress: () => {
            Alert.alert(
              "Feature Coming Soon",
              "Data export will be available in the next update."
            );
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your vehicles and maintenance records. This action cannot be undone!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Feature Coming Soon",
              "Data clearing will be available in the next update."
            );
          },
        },
      ]
    );
  };

  // Show loading overlay during theme switching to prevent navigation errors
  if (themeLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? "#111827" : "#f9fafb",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color={isDark ? "#60a5fa" : "#3b82f6"}
        />
        <Text
          style={{
            marginTop: 16,
            color: isDark ? "#d1d5db" : "#6b7280",
            fontSize: 16,
          }}
        >
          Switching theme...
        </Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <View className="bg-gradient-to-r from-blue-500 to-blue-600 pt-16 pb-8 px-6">
        <Text className="text-white text-2xl font-bold mb-1">Settings</Text>
        <Text className="text-blue-100">Customize your app experience</Text>
      </View>

      <ScrollView className="flex-1">
        {/* App Appearance */}
        <View className="px-6 mt-6 mb-4">
          <Text
            className={`text-xl font-bold mb-3 ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            Appearance
          </Text>

          <View
            className={`rounded-xl shadow-sm p-2 ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <TouchableOpacity
              className="flex-row justify-between items-center p-3"
              onPress={handleThemeToggle}
              disabled={themeLoading}
            >
              <View className="flex-row items-center">
                <MaterialIcons
                  name={isDark ? "dark-mode" : "light-mode"}
                  size={24}
                  color={isDark ? "#60a5fa" : "#3b82f6"}
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text
                    className={`font-medium ${
                      isDark ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Dark Mode
                  </Text>
                  <Text
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {isDark ? "Switch to light theme" : "Switch to dark theme"}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={handleThemeToggle}
                trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
                thumbColor={isDark ? "#eff6ff" : "#f3f4f6"}
                disabled={themeLoading}
              />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row justify-between items-center p-3"
              onPress={toggleMeasurementUnit}
            >
              <View className="flex-row items-center">
                <MaterialIcons
                  name="speed"
                  size={24}
                  color={isDark ? "#60a5fa" : "#3b82f6"}
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text
                    className={`font-medium ${
                      isDark ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Measurement Unit
                  </Text>
                  <Text
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Currently using {measurementUnit}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <Text
                  className={`mr-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {measurementUnit === "miles" ? "mi" : "km"}
                </Text>
                <Switch
                  value={measurementUnit === "kilometers"}
                  onValueChange={toggleMeasurementUnit}
                  trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
                  thumbColor={
                    measurementUnit === "kilometers" ? "#eff6ff" : "#f3f4f6"
                  }
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <View className="px-6 mb-4">
          <Text
            className={`text-xl font-bold mb-3 ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            Notifications
          </Text>

          <View
            className={`rounded-xl shadow-sm p-2 ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <View className="flex-row justify-between items-center p-3">
              <View className="flex-row items-center">
                <MaterialIcons
                  name="notifications"
                  size={24}
                  color={isDark ? "#60a5fa" : "#3b82f6"}
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text
                    className={`font-medium ${
                      isDark ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Push Notifications
                  </Text>
                  <Text
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Get alerts on your device
                  </Text>
                </View>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={togglePushNotifications}
                trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
                thumbColor={pushNotifications ? "#eff6ff" : "#f3f4f6"}
              />
            </View>

            <View className="flex-row justify-between items-center p-3">
              <View className="flex-row items-center">
                <MaterialIcons
                  name="email"
                  size={24}
                  color={isDark ? "#60a5fa" : "#3b82f6"}
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text
                    className={`font-medium ${
                      isDark ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Email Notifications
                  </Text>
                  <Text
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Receive updates via email
                  </Text>
                </View>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={toggleEmailNotifications}
                trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
                thumbColor={emailNotifications ? "#eff6ff" : "#f3f4f6"}
              />
            </View>

            <View className="flex-row justify-between items-center p-3">
              <View className="flex-row items-center">
                <MaterialIcons
                  name="update"
                  size={24}
                  color={isDark ? "#60a5fa" : "#3b82f6"}
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text
                    className={`font-medium ${
                      isDark ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Maintenance Reminders
                  </Text>
                  <Text
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Get reminded about upcoming maintenance
                  </Text>
                </View>
              </View>
              <Switch
                value={maintenanceReminders}
                onValueChange={toggleMaintenanceReminders}
                trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
                thumbColor={maintenanceReminders ? "#eff6ff" : "#f3f4f6"}
              />
            </View>
          </View>
        </View>

        {/* Data & Privacy */}
        <View className="px-6 mb-4">
          <Text
            className={`text-xl font-bold mb-3 ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            Data & Privacy
          </Text>

          <View
            className={`rounded-xl shadow-sm ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <TouchableOpacity
              className={`flex-row justify-between items-center p-4 border-b ${
                isDark ? "border-gray-700" : "border-gray-100"
              }`}
              onPress={handleExportData}
            >
              <View className="flex-row items-center">
                <MaterialIcons
                  name="download"
                  size={24}
                  color={isDark ? "#60a5fa" : "#3b82f6"}
                  style={{ marginRight: 12 }}
                />
                <Text
                  className={`font-medium ${
                    isDark ? "text-white" : "text-gray-800"
                  }`}
                >
                  Export My Data
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row justify-between items-center p-4"
              onPress={handleClearData}
            >
              <View className="flex-row items-center">
                <MaterialIcons
                  name="delete-outline"
                  size={24}
                  color="#ef4444"
                  style={{ marginRight: 12 }}
                />
                <Text className="font-medium text-red-500">Clear All Data</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View className="px-6 mb-4">
          <Text
            className={`text-xl font-bold mb-3 ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            About
          </Text>

          <View
            className={`rounded-xl shadow-sm p-2 ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <View className="p-3">
              <Text
                className={`font-medium ${
                  isDark ? "text-white" : "text-gray-800"
                }`}
              >
                Auto Home Care
              </Text>
              <Text
                className={`text-xs mt-1 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Version {appVersion} (Build {buildVersion})
              </Text>
            </View>

            <TouchableOpacity
              className={`flex-row justify-between items-center p-3 border-t ${
                isDark ? "border-gray-700" : "border-gray-100"
              }`}
              onPress={() =>
                Alert.alert(
                  "Privacy Policy",
                  "Our privacy policy details will be displayed here."
                )
              }
            >
              <Text className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Privacy Policy
              </Text>
              <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row justify-between items-center p-3 border-t ${
                isDark ? "border-gray-700" : "border-gray-100"
              }`}
              onPress={() =>
                Alert.alert(
                  "Terms of Service",
                  "Our terms of service will be displayed here."
                )
              }
            >
              <Text className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Terms of Service
              </Text>
              <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account */}
        <View className="px-6 mb-10">
          <Text
            className={`text-xl font-bold mb-3 ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            Account
          </Text>

          <View
            className={`rounded-xl shadow-sm ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <TouchableOpacity
              className="flex-row items-center p-4"
              onPress={() => router.push("../profile")}
            >
              <MaterialIcons
                name="person"
                size={24}
                color={isDark ? "#60a5fa" : "#3b82f6"}
                style={{ marginRight: 12 }}
              />
              <Text
                className={`font-medium ${
                  isDark ? "text-white" : "text-gray-800"
                }`}
              >
                Edit Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center p-4 border-t ${
                isDark ? "border-gray-700" : "border-gray-100"
              }`}
              onPress={handleLogout}
            >
              <MaterialIcons
                name="logout"
                size={24}
                color="#ef4444"
                style={{ marginRight: 12 }}
              />
              <Text className="font-medium text-red-500">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingScreen;
