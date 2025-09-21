import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import {
  getAllVehicles,
  getVehicleMaintenanceColRef,
  getUpcomingMaintenanceTasks,
} from "@/services/vehicleService";
import { Vehicle } from "@/types/vehicle";
import { MaintenanceTask } from "@/types/maintenanceTask";
import { useAuth } from "@/context/AuthContext";
import { useLoader } from "@/context/LoaderContext";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const HomeScreen = () => {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [upcomingServices, setUpcomingServices] = useState<MaintenanceTask[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { showLoader, hideLoader } = useLoader();
  const { isDark } = useTheme();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const vehicleCardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(vehicleCardAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const loadData = async () => {
      try {
        showLoader();
        console.log("Loading vehicles for user ID:", user.uid);

        const vehicleData = await getAllVehicles();
        console.log("Vehicles loaded:", vehicleData.length);
        setVehicles(vehicleData);

        if (vehicleData.length > 0) {
          let allUpcomingTasks: MaintenanceTask[] = [];
          for (const vehicle of vehicleData) {
            try {
              const tasks = await getUpcomingMaintenanceTasks(vehicle.id);
              allUpcomingTasks = [...allUpcomingTasks, ...tasks];
            } catch (vehicleError) {
              console.error(
                "Error loading maintenance for vehicle",
                vehicle.id,
                vehicleError
              );
            }
          }

          allUpcomingTasks.sort((a, b) => {
            if (a.dueDate && b.dueDate) {
              return (
                new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
              );
            }
            return 0;
          });

          setUpcomingServices(allUpcomingTasks.slice(0, 5));
        }
      } catch (error) {
        console.error("Error loading home data:", error);
        Alert.alert(
          "Data Loading Error",
          "Could not load your vehicle data. Please ensure you're signed in properly."
        );
      } finally {
        hideLoader();
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, user?.uid]);

  const handleAddVehicle = () => {
    router.push("../vehicles");
  };

  const handleViewVehicle = (vehicleId: string) => {
    router.push(`../vehicles`);
  };

  const handleScheduleService = () => {
    if (vehicles.length > 0) {
      // Navigate to vehicles tab first, then handle service scheduling
      router.push("../vehicles");
    } else {
      alert("Please add a vehicle first before scheduling maintenance.");
      router.push("../vehicles");
    }
  };

  const handleFindParts = () => {
    alert("Find Parts feature coming soon!");
  };

  const formatDueDate = (task: MaintenanceTask) => {
    if (!task.dueDate) return "Based on mileage";

    const date = new Date(task.dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));

    if (diffMonths <= 0) return "Overdue";
    if (diffMonths === 1) return "Due in 1 month";
    return `Due in ${diffMonths} months`;
  };

  if (loading) {
    return (
      <View
        className={`flex-1 justify-center items-center ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <ActivityIndicator
          size="large"
          color={isDark ? "#60a5fa" : "#000000"}
        />
        <Text className={`mt-4 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
          Loading your garage...
        </Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Background Decoration */}
      <View className="absolute inset-0">
        <View
          className={`absolute w-80 h-80 rounded-full ${
            isDark ? "bg-gray-800/30" : "bg-gray-100"
          }`}
          style={{ top: -150, right: -100 }}
        />
        <View
          className={`absolute w-96 h-96 rounded-full ${
            isDark ? "bg-gray-700/20" : "bg-gray-200"
          }`}
          style={{ bottom: -200, left: -150 }}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Header Section */}
          <View className="pt-16 pb-8 px-6">
            <View className="flex-row items-center justify-between mb-2">
              <View>
                <Text
                  className={`text-3xl font-bold ${
                    isDark ? "text-white" : "text-black"
                  }`}
                >
                  Hello, {user?.displayName || "User"}
                </Text>
                <Text
                  className={`text-lg ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  } mt-1`}
                >
                  Here's an overview of your vehicle.
                </Text>
              </View>
              <Pressable
                className={`w-12 h-12 rounded-xl justify-center items-center ${
                  isDark
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-200"
                }`}
                onPress={() => router.push("../profile")}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={isDark ? "#ffffff" : "#000000"}
                />
              </Pressable>
            </View>
          </View>

          {/* Vehicle Status Card */}
          {vehicles.length > 0 ? (
            <Animated.View
              style={{
                opacity: vehicleCardAnim,
                transform: [{ scale: vehicleCardAnim }],
              }}
              className="px-6 mb-8"
            >
              <Text
                className={`text-2xl font-bold mb-4 ${
                  isDark ? "text-white" : "text-black"
                }`}
              >
                Vehicle Status
              </Text>

              <Pressable
                className={`rounded-3xl p-6 shadow-lg ${
                  isDark
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-100"
                }`}
                onPress={() => handleViewVehicle(vehicles[0].id)}
                style={{
                  shadowColor: isDark ? "#000000" : "#000000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isDark ? 0.3 : 0.1,
                  shadowRadius: 12,
                  elevation: 5,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      className={`text-xl font-bold mb-2 ${
                        isDark ? "text-white" : "text-black"
                      }`}
                    >
                      {vehicles[0].year} {vehicles[0].make} {vehicles[0].model}
                    </Text>

                    <View className="space-y-2">
                      <View className="flex-row items-center">
                        <Ionicons
                          name="battery-charging-outline"
                          size={16}
                          color={isDark ? "#60a5fa" : "#3b82f6"}
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          className={`${
                            isDark ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          Engine Health: Good
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <Ionicons
                          name="speedometer-outline"
                          size={16}
                          color={isDark ? "#60a5fa" : "#3b82f6"}
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          className={`${
                            isDark ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          Mileage:{" "}
                          {vehicles[0].mileage
                            .toString()
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" "}
                          miles
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Vehicle Image Section */}
                  <View
                    className={`w-24 h-24 rounded-2xl overflow-hidden justify-center items-center ${
                      isDark ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    {vehicles[0].imageUrl ? (
                      <>
                        {imageLoading && (
                          <View className="absolute inset-0 flex items-center justify-center z-10">
                            <ActivityIndicator
                              size="small"
                              color={isDark ? "#60a5fa" : "#3b82f6"}
                            />
                          </View>
                        )}
                        <Image
                          source={{ uri: vehicles[0].imageUrl }}
                          className="w-full h-full"
                          resizeMode="cover"
                          onLoadStart={() => setImageLoading(true)}
                          onLoad={() => setImageLoading(false)}
                          onError={() => setImageLoading(false)}
                        />
                      </>
                    ) : (
                      <Text className="text-4xl">🚗</Text>
                    )}
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ) : (
            // No Vehicle State
            <View className="px-6 mb-8">
              <Text
                className={`text-2xl font-bold mb-4 ${
                  isDark ? "text-white" : "text-black"
                }`}
              >
                Vehicle Status
              </Text>

              <View
                className={`rounded-3xl p-8 items-center shadow-lg ${
                  isDark
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-100"
                }`}
              >
                <Text className="text-6xl mb-4">🚗</Text>
                <Text
                  className={`text-xl font-bold mb-2 ${
                    isDark ? "text-white" : "text-black"
                  }`}
                >
                  No vehicles yet
                </Text>
                <Text
                  className={`text-center mb-6 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Add your first vehicle to start tracking maintenance
                </Text>
                <Pressable
                  className={`px-8 py-4 rounded-2xl ${
                    isDark ? "bg-blue-600" : "bg-black"
                  }`}
                  onPress={handleAddVehicle}
                >
                  <Text className="text-white font-bold text-lg">
                    Add Vehicle
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Upcoming Maintenance */}
          <View className="px-6 mb-8">
            <Text
              className={`text-2xl font-bold mb-4 ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              Upcoming Maintenance
            </Text>

            {upcomingServices.length === 0 ? (
              <View
                className={`rounded-2xl p-8 items-center ${
                  isDark
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-100"
                }`}
              >
                <Text className="text-4xl mb-3">🔧</Text>
                <Text
                  className={`font-medium text-center ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  No upcoming services
                </Text>
                <Text
                  className={`text-sm text-center mt-2 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  All caught up with maintenance!
                </Text>
              </View>
            ) : (
              <View className="space-y-4">
                {upcomingServices.slice(0, 2).map((service, index) => (
                  <Pressable
                    key={service.id}
                    className={`rounded-2xl p-5 shadow-sm ${
                      isDark
                        ? "bg-gray-800 border border-gray-700"
                        : "bg-white border border-gray-100"
                    }`}
                    onPress={() => router.push("../dashboard/vehicles")}
                  >
                    <View className="flex-row items-center">
                      <View
                        className={`w-12 h-12 rounded-xl justify-center items-center mr-4 ${
                          isDark ? "bg-gray-700" : "bg-gray-100"
                        }`}
                      >
                        <Ionicons
                          name={index === 0 ? "car-outline" : "build-outline"}
                          size={24}
                          color={isDark ? "#ffffff" : "#000000"}
                        />
                      </View>

                      <View className="flex-1">
                        <Text
                          className={`text-lg font-bold ${
                            isDark ? "text-white" : "text-black"
                          }`}
                        >
                          {service.title}
                        </Text>
                        <Text
                          className={`text-sm ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {formatDueDate(service)}
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={isDark ? "#9ca3af" : "#6b7280"}
                      />
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View className="px-6 mb-8">
            <Text
              className={`text-2xl font-bold mb-4 ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              Quick Actions
            </Text>

            <View className="flex-row space-x-4">
              <Pressable
                className={`rounded-2xl p-6 flex-1 items-center shadow-lg ${
                  isDark ? "bg-blue-600" : "bg-black"
                }`}
                onPress={handleScheduleService}
                style={{
                  shadowColor: "#000000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <Ionicons name="calendar-outline" size={24} color="#ffffff" />
                <Text className="text-white font-bold text-lg mt-2">
                  Schedule Service
                </Text>
              </Pressable>

              <Pressable
                className={`rounded-2xl p-6 flex-1 items-center shadow-sm ${
                  isDark
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-200"
                }`}
                onPress={handleFindParts}
              >
                <Ionicons
                  name="search-outline"
                  size={24}
                  color={isDark ? "#ffffff" : "#000000"}
                />
                <Text
                  className={`font-bold text-lg mt-2 ${
                    isDark ? "text-white" : "text-black"
                  }`}
                >
                  Find Parts
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
