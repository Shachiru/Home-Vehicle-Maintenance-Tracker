import { View, Text, ActivityIndicator, Animated } from "react-native";
import React, { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulsing animation for the logo
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  useEffect(() => {
    if (!loading) {
      // Add a small delay for smooth loading experience
      setTimeout(() => {
        if (user) {
          // For now, stay on this screen or create a main screen
          console.log("User is authenticated, staying on main screen");
        } else {
          router.replace("/signin");
        }
      }, 1500);
    }
  }, [loading, user]);

  // If user is authenticated and not loading, show the main app content
  if (!loading && user) {
    return (
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-gradient-to-r from-blue-500 to-blue-600 pt-14 pb-6 px-6 shadow-lg">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-3xl font-bold">
                AutoHome Care
              </Text>
              <Text className="text-blue-100 text-base mt-1 font-medium">
                Welcome back, Driver! 👋
              </Text>
            </View>
            <View className="w-12 h-12 bg-white/20 rounded-full justify-center items-center">
              <Text className="text-2xl">🚗</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="px-6 -mt-4">
          <View className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <View className="flex-row justify-between items-center">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-gray-800">2</Text>
                <Text className="text-sm text-gray-600 mt-1">Vehicles</Text>
              </View>
              <View className="w-px h-8 bg-gray-200" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-orange-500">3</Text>
                <Text className="text-sm text-gray-600 mt-1">Due Soon</Text>
              </View>
              <View className="w-px h-8 bg-gray-200" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-green-500">12</Text>
                <Text className="text-sm text-gray-600 mt-1">Completed</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View className="flex-1 px-6 mt-6">
          <Text className="text-gray-800 text-xl font-bold mb-4">
            Recent Activity
          </Text>

          {/* Vehicle Cards */}
          <View className="space-y-4">
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-3">
                <View className="w-12 h-12 bg-blue-100 rounded-xl justify-center items-center mr-4">
                  <Text className="text-xl">🚙</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-bold text-lg">
                    Honda Civic
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    Last service: 2 weeks ago
                  </Text>
                </View>
                <View className="w-3 h-3 bg-green-400 rounded-full" />
              </View>
              <Text className="text-gray-600 text-sm">
                Next oil change due in 1,200 miles
              </Text>
            </View>

            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-3">
                <View className="w-12 h-12 bg-orange-100 rounded-xl justify-center items-center mr-4">
                  <Text className="text-xl">🚗</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-bold text-lg">
                    Toyota Camry
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    Last service: 1 month ago
                  </Text>
                </View>
                <View className="w-3 h-3 bg-orange-400 rounded-full" />
              </View>
              <Text className="text-gray-600 text-sm">
                Tire rotation recommended
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mt-8 mb-6">
            <Text className="text-gray-800 text-lg font-bold mb-4">
              Quick Actions
            </Text>
            <View className="flex-row justify-between">
              <View className="bg-blue-500 rounded-2xl p-4 flex-1 mr-2 items-center">
                <Text className="text-2xl mb-2">➕</Text>
                <Text className="text-white font-semibold text-sm text-center">
                  Add Vehicle
                </Text>
              </View>
              <View className="bg-green-500 rounded-2xl p-4 flex-1 mx-2 items-center">
                <Text className="text-2xl mb-2">🔧</Text>
                <Text className="text-white font-semibold text-sm text-center">
                  Log Service
                </Text>
              </View>
              <View className="bg-purple-500 rounded-2xl p-4 flex-1 ml-2 items-center">
                <Text className="text-2xl mb-2">📊</Text>
                <Text className="text-white font-semibold text-sm text-center">
                  View Reports
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Show loading screen
  return (
    <View className="flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 justify-center items-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <View className="absolute inset-0">
        {/* Large decorative circles */}
        <View className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full" />
        <View className="absolute -bottom-32 -left-20 w-64 h-64 bg-white/5 rounded-full" />
        <View className="absolute top-1/3 -right-16 w-32 h-32 bg-white/8 rounded-full" />

        {/* Small floating dots */}
        <View className="absolute top-24 left-12 w-2 h-2 bg-white/30 rounded-full" />
        <View className="absolute top-40 right-20 w-3 h-3 bg-white/25 rounded-full" />
        <View className="absolute bottom-1/3 left-16 w-2 h-2 bg-white/35 rounded-full" />
        <View className="absolute bottom-1/4 right-12 w-4 h-4 bg-white/20 rounded-full" />
      </View>

      {/* Main Content */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
        className="items-center z-10"
      >
        {/* Logo Container */}
        <Animated.View
          style={{ transform: [{ scale: pulseAnim }] }}
          className="mb-8"
        >
          <View className="h-32 w-32 bg-white rounded-3xl justify-center items-center shadow-2xl">
            <Text className="text-6xl">🚗</Text>
          </View>
        </Animated.View>

        {/* App Branding */}
        <View className="items-center mb-12">
          <Text className="text-white text-4xl font-bold mb-2 tracking-wide">
            AutoHome Care
          </Text>
          <Text className="text-blue-200 text-lg font-medium tracking-wider">
            VEHICLE MAINTENANCE TRACKER
          </Text>
          <View className="w-20 h-1 bg-white/40 rounded-full mt-3" />
        </View>

        {/* Loading Section */}
        <View className="items-center">
          <View className="bg-white/10 rounded-2xl p-6 items-center backdrop-blur-sm">
            <ActivityIndicator size="large" color="#ffffff" className="mb-4" />
            <Text className="text-white text-base font-medium">
              {loading
                ? "Initializing your garage..."
                : "Starting your engines..."}
            </Text>
          </View>
        </View>

        {/* Feature Highlights */}
        <View className="mt-16 items-center">
          <Text className="text-blue-200 text-sm font-medium mb-4">
            FEATURES
          </Text>
          <View className="flex-row space-x-8">
            <View className="items-center">
              <View className="w-12 h-12 bg-white/20 rounded-xl justify-center items-center mb-2">
                <Text className="text-lg">🔧</Text>
              </View>
              <Text className="text-blue-200 text-xs font-medium">
                Maintenance
              </Text>
            </View>
            <View className="items-center">
              <View className="w-12 h-12 bg-white/20 rounded-xl justify-center items-center mb-2">
                <Text className="text-lg">📅</Text>
              </View>
              <Text className="text-blue-200 text-xs font-medium">
                Reminders
              </Text>
            </View>
            <View className="items-center">
              <View className="w-12 h-12 bg-white/20 rounded-xl justify-center items-center mb-2">
                <Text className="text-lg">📊</Text>
              </View>
              <Text className="text-blue-200 text-xs font-medium">
                Analytics
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Bottom Section */}
      <View className="absolute bottom-8 items-center">
        <Text className="text-blue-300 text-xs font-light tracking-wider">
          VERSION 1.0.0
        </Text>
        <Text className="text-blue-400 text-xs mt-1 font-medium">
          Built with ❤️ for car enthusiasts
        </Text>
      </View>
    </View>
  );
};

export default Index;
