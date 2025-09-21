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
    if (themeLoading) return;

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

  // Show loading overlay during theme switching
  if (themeLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? "#000000" : "#ffffff",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color={isDark ? "#ffffff" : "#000000"}
        />
        <Text
          style={{
            marginTop: 16,
            color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
            fontSize: 16,
          }}
        >
          Switching theme...
        </Text>
      </View>
    );
  }

  // Setting Item Component
  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    showBorder = true,
    danger = false,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showBorder?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      className={`flex-row items-center px-6 py-4 ${
        showBorder
          ? `border-b ${isDark ? "border-white/5" : "border-black/5"}`
          : ""
      }`}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
          danger
            ? isDark
              ? "bg-red-500/10"
              : "bg-red-500/10"
            : isDark
            ? "bg-white/5"
            : "bg-black/5"
        }`}
      >
        <MaterialIcons
          name={icon as any}
          size={24}
          color={
            danger
              ? "#ef4444"
              : isDark
              ? "rgba(255,255,255,0.9)"
              : "rgba(0,0,0,0.9)"
          }
        />
      </View>
      <View className="flex-1">
        <Text
          className={`text-base font-medium ${
            danger ? "text-red-500" : isDark ? "text-white" : "text-black"
          }`}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            className={`text-sm mt-0.5 ${
              isDark ? "text-white/50" : "text-black/50"
            }`}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement ||
        (onPress && (
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
          />
        ))}
    </TouchableOpacity>
  );

  // Section Header Component
  const SectionHeader = ({ title }: { title: string }) => (
    <Text
      className={`text-xs font-semibold uppercase tracking-wider px-6 mb-3 ${
        isDark ? "text-white/40" : "text-black/40"
      }`}
    >
      {title}
    </Text>
  );

  return (
    <View className={`flex-1 ${isDark ? "bg-black" : "bg-white"}`}>
      {/* Header */}
      <View className={`pt-16 pb-8 px-6 ${isDark ? "bg-black" : "bg-white"}`}>
        <Text
          className={`text-4xl font-bold ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* User Profile Section */}
        <TouchableOpacity
          className={`mx-6 mb-8 p-6 rounded-3xl flex-row items-center ${
            isDark ? "bg-white/5" : "bg-black/5"
          }`}
          onPress={() => router.push("../profile")}
          activeOpacity={0.8}
        >
          <View
            className={`w-20 h-20 rounded-full items-center justify-center mr-4 ${
              isDark ? "bg-white/10" : "bg-black/10"
            }`}
          >
            <MaterialIcons
              name="person"
              size={36}
              color={isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)"}
            />
          </View>
          <View className="flex-1">
            <Text
              className={`text-xl font-semibold ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              {user?.displayName || "User"}
            </Text>
            <Text
              className={`text-sm mt-1 ${
                isDark ? "text-white/60" : "text-black/60"
              }`}
            >
              {user?.email || "Manage your profile"}
            </Text>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
          />
        </TouchableOpacity>

        {/* Preferences Section */}
        <View className="mb-8">
          <SectionHeader title="Preferences" />
          <View
            className={`mx-6 rounded-3xl overflow-hidden ${
              isDark ? "bg-white/5" : "bg-black/5"
            }`}
          >
            <SettingItem
              icon={isDark ? "dark-mode" : "light-mode"}
              title="Appearance"
              subtitle={isDark ? "Dark theme" : "Light theme"}
              rightElement={
                <Switch
                  value={isDark}
                  onValueChange={handleThemeToggle}
                  trackColor={{
                    false: "rgba(0,0,0,0.1)",
                    true: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.9)",
                  }}
                  thumbColor={isDark ? "#ffffff" : "#ffffff"}
                  disabled={themeLoading}
                  style={{ transform: [{ scale: 0.9 }] }}
                />
              }
            />
            <SettingItem
              icon="speed"
              title="Distance Units"
              subtitle={`Currently using ${measurementUnit}`}
              rightElement={
                <View className="flex-row items-center">
                  <Text
                    className={`text-sm font-medium mr-3 ${
                      isDark ? "text-white/70" : "text-black/70"
                    }`}
                  >
                    {measurementUnit === "miles" ? "MI" : "KM"}
                  </Text>
                  <Switch
                    value={measurementUnit === "kilometers"}
                    onValueChange={toggleMeasurementUnit}
                    trackColor={{
                      false: "rgba(0,0,0,0.1)",
                      true: isDark
                        ? "rgba(255,255,255,0.3)"
                        : "rgba(0,0,0,0.9)",
                    }}
                    thumbColor={isDark ? "#ffffff" : "#ffffff"}
                    style={{ transform: [{ scale: 0.9 }] }}
                  />
                </View>
              }
              showBorder={false}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View className="mb-8">
          <SectionHeader title="Notifications" />
          <View
            className={`mx-6 rounded-3xl overflow-hidden ${
              isDark ? "bg-white/5" : "bg-black/5"
            }`}
          >
            <SettingItem
              icon="notifications"
              title="Push Notifications"
              subtitle="Receive alerts on your device"
              rightElement={
                <Switch
                  value={pushNotifications}
                  onValueChange={togglePushNotifications}
                  trackColor={{
                    false: "rgba(0,0,0,0.1)",
                    true: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.9)",
                  }}
                  thumbColor={isDark ? "#ffffff" : "#ffffff"}
                  style={{ transform: [{ scale: 0.9 }] }}
                />
              }
            />
            <SettingItem
              icon="email"
              title="Email Notifications"
              subtitle="Get updates in your inbox"
              rightElement={
                <Switch
                  value={emailNotifications}
                  onValueChange={toggleEmailNotifications}
                  trackColor={{
                    false: "rgba(0,0,0,0.1)",
                    true: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.9)",
                  }}
                  thumbColor={isDark ? "#ffffff" : "#ffffff"}
                  style={{ transform: [{ scale: 0.9 }] }}
                />
              }
            />
            <SettingItem
              icon="event"
              title="Maintenance Reminders"
              subtitle="Never miss scheduled maintenance"
              rightElement={
                <Switch
                  value={maintenanceReminders}
                  onValueChange={toggleMaintenanceReminders}
                  trackColor={{
                    false: "rgba(0,0,0,0.1)",
                    true: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.9)",
                  }}
                  thumbColor={isDark ? "#ffffff" : "#ffffff"}
                  style={{ transform: [{ scale: 0.9 }] }}
                />
              }
              showBorder={false}
            />
          </View>
        </View>

        {/* Data Management Section */}
        <View className="mb-8">
          <SectionHeader title="Data Management" />
          <View
            className={`mx-6 rounded-3xl overflow-hidden ${
              isDark ? "bg-white/5" : "bg-black/5"
            }`}
          >
            <SettingItem
              icon="cloud-download"
              title="Export Data"
              subtitle="Download your data as a file"
              onPress={handleExportData}
            />
            <SettingItem
              icon="delete-forever"
              title="Clear All Data"
              subtitle="Permanently delete all records"
              onPress={handleClearData}
              showBorder={false}
              danger
            />
          </View>
        </View>

        {/* Support Section */}
        <View className="mb-8">
          <SectionHeader title="Support" />
          <View
            className={`mx-6 rounded-3xl overflow-hidden ${
              isDark ? "bg-white/5" : "bg-black/5"
            }`}
          >
            <SettingItem
              icon="help-outline"
              title="Help Center"
              subtitle="Get help and support"
              onPress={() => Alert.alert("Help Center", "Coming soon!")}
            />
            <SettingItem
              icon="feedback"
              title="Send Feedback"
              subtitle="Share your thoughts with us"
              onPress={() => Alert.alert("Feedback", "Coming soon!")}
              showBorder={false}
            />
          </View>
        </View>

        {/* Legal Section */}
        <View className="mb-8">
          <SectionHeader title="Legal" />
          <View
            className={`mx-6 rounded-3xl overflow-hidden ${
              isDark ? "bg-white/5" : "bg-black/5"
            }`}
          >
            <SettingItem
              icon="privacy-tip"
              title="Privacy Policy"
              subtitle="How we handle your data"
              onPress={() =>
                Alert.alert(
                  "Privacy Policy",
                  "Our privacy policy details will be displayed here."
                )
              }
            />
            <SettingItem
              icon="description"
              title="Terms of Service"
              subtitle="Terms and conditions"
              onPress={() =>
                Alert.alert(
                  "Terms of Service",
                  "Our terms of service will be displayed here."
                )
              }
              showBorder={false}
            />
          </View>
        </View>

        {/* About Section */}
        <View className="mb-8">
          <SectionHeader title="About" />
          <View
            className={`mx-6 rounded-3xl overflow-hidden ${
              isDark ? "bg-white/5" : "bg-black/5"
            }`}
          >
            <View className="px-6 py-4">
              <View className="flex-row items-center mb-4">
                <View
                  className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
                    isDark ? "bg-white/10" : "bg-black/10"
                  }`}
                >
                  <MaterialIcons
                    name="directions-car"
                    size={24}
                    color={isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)"}
                  />
                </View>
                <View>
                  <Text
                    className={`text-lg font-semibold ${
                      isDark ? "text-white" : "text-black"
                    }`}
                  >
                    Auto Home Care
                  </Text>
                  <Text
                    className={`text-sm ${
                      isDark ? "text-white/50" : "text-black/50"
                    }`}
                  >
                    Version {appVersion} (Build {buildVersion})
                  </Text>
                </View>
              </View>
              <Text
                className={`text-sm leading-5 ${
                  isDark ? "text-white/40" : "text-black/40"
                }`}
              >
                Your trusted companion for vehicle maintenance and care. Keep
                track of all your vehicles in one place.
              </Text>
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View className="mb-8">
          <SectionHeader title="Account" />
          <View
            className={`mx-6 rounded-3xl overflow-hidden ${
              isDark ? "bg-white/5" : "bg-black/5"
            }`}
          >
            <TouchableOpacity
              className="flex-row items-center px-6 py-4"
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View
                className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 bg-red-500/10`}
              >
                <MaterialIcons name="logout" size={24} color="#ef4444" />
              </View>
              <Text className="text-base font-medium text-red-500">
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="px-6 pb-8">
          <Text
            className={`text-center text-xs ${
              isDark ? "text-white/30" : "text-black/30"
            }`}
          >
            Made with ❤️ by Auto Home Care Team
          </Text>
          <Text
            className={`text-center text-xs mt-1 ${
              isDark ? "text-white/20" : "text-black/20"
            }`}
          >
            © 2025 Auto Home Care. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingScreen;
