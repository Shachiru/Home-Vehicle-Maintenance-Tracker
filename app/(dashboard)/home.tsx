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
  RefreshControl,
} from "react-native";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "expo-router";
import {
  getAllVehicles,
  getUpcomingMaintenanceTasks,
} from "@/services/vehicleService";
import { Vehicle } from "@/types/vehicle";
import { MaintenanceTask } from "@/types/maintenanceTask";
import { useAuth } from "@/context/AuthContext";
import { useLoader } from "@/context/LoaderContext";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const HomeScreen = () => {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [upcomingServices, setUpcomingServices] = useState<
    (MaintenanceTask & { vehicleName: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const loadData = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      showLoader();
      console.log("Loading vehicles for user ID:", user.uid);

      const vehicleData = await getAllVehicles();
      console.log("Vehicles loaded:", vehicleData.length);
      setVehicles(vehicleData);

      if (vehicleData.length > 0) {
        let allUpcomingTasks: (MaintenanceTask & { vehicleName: string })[] =
          [];

        for (const vehicle of vehicleData) {
          try {
            const tasks = await getUpcomingMaintenanceTasks(vehicle.id);
            // Add vehicle name to each task
            const tasksWithVehicle = tasks.map((task) => ({
              ...task,
              vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            }));
            allUpcomingTasks = [...allUpcomingTasks, ...tasksWithVehicle];
          } catch (vehicleError) {
            console.error(
              "Error loading maintenance for vehicle",
              vehicle.id,
              vehicleError
            );
          }
        }

        // Sort by due date first, then by due mileage
        allUpcomingTasks.sort((a, b) => {
          // If both have due dates, compare them
          if (a.dueDate && b.dueDate) {
            return (
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            );
          }
          // If only a has due date, prioritize it
          if (a.dueDate) return -1;
          // If only b has due date, prioritize it
          if (b.dueDate) return 1;
          // If neither has due date, compare mileage
          if (a.dueMileage && b.dueMileage) {
            return a.dueMileage - b.dueMileage;
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
      setRefreshing(false);
    }
  }, [isAuthenticated, user?.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleAddVehicle = () => {
    router.push("../vehicles");
  };

  const handleViewVehicle = (vehicleId: string) => {
    router.push(`/vehicles/${vehicleId}`);
  };

  const handleViewMaintenance = (vehicleId: string) => {
    router.push(`/vehicles/maintenance/${vehicleId}`);
  };

  const handleScheduleService = () => {
    if (vehicles.length > 0) {
      // Navigate to vehicles tab first, then handle service scheduling
      router.push(`/vehicles/maintenance/task/new?vehicleId=${vehicles[0].id}`);
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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Overdue";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays < 7) return `Due in ${diffDays} days`;
    if (diffDays < 31) return `Due in ${Math.ceil(diffDays / 7)} weeks`;
    return `Due on ${date.toLocaleDateString()}`;
  };

  const getTaskPriorityColor = (task: MaintenanceTask) => {
    if (!task.dueDate && !task.dueMileage)
      return isDark ? "#9ca3af" : "#6b7280";

    if (task.dueDate) {
      const date = new Date(task.dueDate);
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) return "#ef4444";
      if (diffDays < 7) return "#f59e0b";
    }

    // Default color for normal priority
    return "#10b981";
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[isDark ? "#60a5fa" : "#3b82f6"]}
            tintColor={isDark ? "#60a5fa" : "#3b82f6"}
          />
        }
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
                  Welcome to your vehicle dashboard
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
            <View className="px-6 mb-8">
              <View className="flex-row justify-between items-center mb-4">
                <Text
                  className={`text-2xl font-bold ${
                    isDark ? "text-white" : "text-black"
                  }`}
                >
                  My Vehicles
                </Text>
                <Pressable onPress={() => router.push("../vehicles")}>
                  <Text
                    className={`${isDark ? "text-blue-400" : "text-blue-600"}`}
                  >
                    View All
                  </Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 20 }}
              >
                {vehicles.map((vehicle, index) => (
                  <Animated.View
                    key={vehicle.id}
                    style={{
                      opacity: vehicleCardAnim,
                      transform: [{ scale: vehicleCardAnim }],
                      marginLeft: index === 0 ? 0 : 12,
                      marginRight: index === vehicles.length - 1 ? 0 : 0,
                    }}
                  >
                    <Pressable
                      className={`rounded-3xl p-6 shadow-lg ${
                        isDark
                          ? "bg-gray-800 border border-gray-700"
                          : "bg-white border border-gray-100"
                      }`}
                      onPress={() => handleViewVehicle(vehicle.id)}
                      style={{
                        shadowColor: isDark ? "#000000" : "#000000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isDark ? 0.3 : 0.1,
                        shadowRadius: 12,
                        elevation: 5,
                        width: width * 0.8,
                      }}
                    >
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-1">
                          <Text
                            className={`text-xl font-bold mb-1 ${
                              isDark ? "text-white" : "text-black"
                            }`}
                            numberOfLines={1}
                          >
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </Text>
                          {vehicle.licensePlate && (
                            <View className="bg-blue-100 self-start rounded-md px-2 py-1">
                              <Text className="text-blue-800 text-xs font-medium">
                                {vehicle.licensePlate}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Vehicle Image Section */}
                        <View
                          className={`w-16 h-16 rounded-2xl overflow-hidden justify-center items-center ${
                            isDark ? "bg-gray-700" : "bg-gray-100"
                          }`}
                        >
                          {vehicle.imageUrl ? (
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
                                source={{ uri: vehicle.imageUrl }}
                                className="w-full h-full"
                                resizeMode="cover"
                                onLoadStart={() => setImageLoading(true)}
                                onLoad={() => setImageLoading(false)}
                                onError={() => setImageLoading(false)}
                              />
                            </>
                          ) : (
                            <Text className="text-3xl">🚗</Text>
                          )}
                        </View>
                      </View>

                      <View className="space-y-3 mt-2">
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
                            {vehicle.mileage
                              .toString()
                              .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" "}
                            miles
                          </Text>
                        </View>

                        {vehicle.engineType && (
                          <View className="flex-row items-center">
                            <Ionicons
                              name="car-sport-outline"
                              size={16}
                              color={isDark ? "#60a5fa" : "#3b82f6"}
                              style={{ marginRight: 8 }}
                            />
                            <Text
                              className={`${
                                isDark ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              Engine: {vehicle.engineType}
                            </Text>
                          </View>
                        )}

                        {vehicle.fuelType && (
                          <View className="flex-row items-center">
                            <MaterialCommunityIcons
                              name="gas-station-outline"
                              size={16}
                              color={isDark ? "#60a5fa" : "#3b82f6"}
                              style={{ marginRight: 8 }}
                            />
                            <Text
                              className={`${
                                isDark ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              Fuel: {vehicle.fuelType}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View className="mt-4 flex-row">
                        <Pressable
                          className={`flex-1 rounded-xl py-2 mr-2 ${
                            isDark ? "bg-blue-600" : "bg-blue-500"
                          }`}
                          onPress={() => handleViewMaintenance(vehicle.id)}
                        >
                          <Text className="text-white text-center font-medium">
                            Maintenance
                          </Text>
                        </Pressable>
                        <Pressable
                          className={`flex-1 rounded-xl py-2 ${
                            isDark
                              ? "bg-gray-700 border border-gray-600"
                              : "bg-gray-200"
                          }`}
                          onPress={() => handleViewVehicle(vehicle.id)}
                        >
                          <Text
                            className={`text-center font-medium ${
                              isDark ? "text-white" : "text-gray-800"
                            }`}
                          >
                            Details
                          </Text>
                        </Pressable>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </ScrollView>
            </View>
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
                {upcomingServices.map((service) => (
                  <Pressable
                    key={service.id}
                    className={`rounded-2xl p-5 shadow-sm ${
                      isDark
                        ? "bg-gray-800 border border-gray-700"
                        : "bg-white border border-gray-100"
                    }`}
                    onPress={() =>
                      router.push(`/vehicles/maintenance/${service.vehicleId}`)
                    }
                  >
                    <View className="flex-row items-center">
                      <View
                        className={`w-12 h-12 rounded-xl justify-center items-center mr-4`}
                        style={{
                          backgroundColor:
                            getTaskPriorityColor(service) +
                            (isDark ? "30" : "15"),
                        }}
                      >
                        <Ionicons
                          name="build-outline"
                          size={24}
                          color={getTaskPriorityColor(service)}
                        />
                      </View>

                      <View className="flex-1">
                        <Text
                          className={`text-lg font-bold ${
                            isDark ? "text-white" : "text-black"
                          }`}
                          numberOfLines={1}
                        >
                          {service.title}
                        </Text>
                        <Text
                          className={`text-sm ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {service.vehicleName}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <View
                            className="h-2 w-2 rounded-full mr-2"
                            style={{
                              backgroundColor: getTaskPriorityColor(service),
                            }}
                          />
                          <Text
                            className={`text-sm ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {formatDueDate(service)}
                            {service.dueMileage &&
                              ` • ${service.dueMileage.toLocaleString()} miles`}
                          </Text>
                        </View>
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
                <Text className="text-white font-bold text-lg mt-2 text-center">
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
                  className={`font-bold text-lg mt-2 text-center ${
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
