import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
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
import { onSnapshot } from "firebase/firestore";

const HomeScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [upcomingServices, setUpcomingServices] = useState<MaintenanceTask[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { showLoader, hideLoader } = useLoader();
  const { isDark } = useTheme();

  // Stats calculation
  const quickStats = {
    totalVehicles: vehicles.length,
    upcomingServices: upcomingServices.length,
    completedThisMonth: 0, // This would need to be calculated from your maintenance data
    totalMaintenance: 0, // This would need to be calculated from your maintenance data
  };

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const loadData = async () => {
      try {
        showLoader();
        console.log("Loading vehicles for user ID:", user.uid);

        // Load vehicles with the fixed function
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
        // Show a more descriptive error message for troubleshooting
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
    router.push("../vehicles/new");
  };

  const handleViewVehicle = (vehicleId: string) => {
    router.push(`../vehicles/${vehicleId}`);
  };

  const handleViewAllVehicles = () => {
    router.push("../vehicles");
  };

  const handleQuickService = () => {
    // If they have at least one vehicle, take them to add maintenance for that vehicle
    if (vehicles.length > 0) {
      router.push(
        `../vehicles/maintenance/task/new?vehicleId=${vehicles[0].id}`
      );
    } else {
      // If no vehicles, prompt to add one first
      alert("Please add a vehicle first before logging maintenance.");
      router.push("../vehicles/new");
    }
  };

  // Helper to get priority level based on due date or mileage
  const getTaskPriority = (task: MaintenanceTask, vehicle?: Vehicle) => {
    if (!task) return "low";

    const today = new Date();
    const in7Days = new Date();
    in7Days.setDate(today.getDate() + 7);

    // Check due date
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      if (dueDate < today) return "high";
      if (dueDate < in7Days) return "medium";
    }

    // Check mileage if we have the vehicle
    if (task.dueMileage && vehicle) {
      const milesUntilDue = task.dueMileage - vehicle.mileage;
      if (milesUntilDue <= 0) return "high";
      if (milesUntilDue < 500) return "medium";
    }

    return "low";
  };

  // Helper to format due date display
  const formatDueDate = (task: MaintenanceTask) => {
    if (!task.dueDate) return "";

    const date = new Date(task.dueDate);
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${monthNames[date.getMonth()]} ${date.getDate()}`;
  };

  // Find the vehicle for a task
  const getVehicleForTask = (task: MaintenanceTask) => {
    return vehicles.find((v) => v.id === task.vehicleId);
  };

  // Get vehicle status
  const getVehicleStatus = (vehicle: Vehicle) => {
    const tasks = upcomingServices.filter(
      (task) => task.vehicleId === vehicle.id
    );
    if (tasks.some((task) => getTaskPriority(task, vehicle) === "high")) {
      return "warning";
    }
    return "good";
  };

  // Get next service for vehicle
  const getNextService = (vehicle: Vehicle) => {
    const vehicleTasks = upcomingServices.filter(
      (task) => task.vehicleId === vehicle.id
    );
    if (vehicleTasks.length === 0)
      return { service: "No services due", date: "" };

    // Sort by priority
    vehicleTasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityA = getTaskPriority(a, vehicle);
      const priorityB = getTaskPriority(b, vehicle);
      return (
        priorityOrder[priorityA as keyof typeof priorityOrder] -
        priorityOrder[priorityB as keyof typeof priorityOrder]
      );
    });

    const nextTask = vehicleTasks[0];
    return {
      service: nextTask.title,
      date: nextTask.dueDate ? formatDueDate(nextTask) : "Based on mileage",
    };
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
          color={isDark ? "#60a5fa" : "#3b82f6"}
        />
        <Text className={`mt-4 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
          Loading your garage...
        </Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <View className="bg-gradient-to-r from-blue-500 to-blue-600 pt-14 pb-6 px-6 shadow-lg">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-white text-2xl font-bold">Welcome back!</Text>
            <Text className="text-blue-100 text-base mt-1">
              Track your vehicle maintenance
            </Text>
          </View>
          <Pressable
            className="w-12 h-12 bg-white/20 rounded-full justify-center items-center"
            onPress={() => router.push("../profile")}
          >
            <Text className="text-white text-xl">👤</Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="bg-white/20 rounded-2xl p-4 flex-row items-center">
          <Text className="text-white text-lg mr-3">🔍</Text>
          <TextInput
            className="flex-1 text-white text-base"
            placeholder="Search vehicles, services..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Quick Stats Cards */}
        <View className="px-6 -mt-4 mb-6">
          <View
            className={`rounded-2xl p-6 shadow-md ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-blue-600">
                  {quickStats.totalVehicles}
                </Text>
                <Text
                  className={`text-sm mt-1 text-center ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Vehicles
                </Text>
              </View>
              <View
                className={`w-px h-12 ${
                  isDark ? "bg-gray-700" : "bg-gray-200"
                }`}
              />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-orange-500">
                  {quickStats.upcomingServices}
                </Text>
                <Text
                  className={`text-sm mt-1 text-center ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Due Soon
                </Text>
              </View>
              <View
                className={`w-px h-12 ${
                  isDark ? "bg-gray-700" : "bg-gray-200"
                }`}
              />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-green-500">
                  {quickStats.completedThisMonth}
                </Text>
                <Text
                  className={`text-sm mt-1 text-center ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  This Month
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text
            className={`text-xl font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            Quick Actions
          </Text>
          <View className="flex-row justify-between">
            <Pressable
              className="bg-blue-500 rounded-2xl p-4 flex-1 mr-2 items-center shadow-sm"
              onPress={handleAddVehicle}
            >
              <Text className="text-3xl mb-2">🚗</Text>
              <Text className="text-white font-semibold text-sm text-center">
                Add Vehicle
              </Text>
            </Pressable>

            <Pressable
              className="bg-green-500 rounded-2xl p-4 flex-1 mx-2 items-center shadow-sm"
              onPress={handleQuickService}
            >
              <Text className="text-3xl mb-2">🔧</Text>
              <Text className="text-white font-semibold text-sm text-center">
                Log Service
              </Text>
            </Pressable>

            <Pressable
              className="bg-purple-500 rounded-2xl p-4 flex-1 ml-2 items-center shadow-sm"
              onPress={() => alert("Analytics feature coming soon!")}
            >
              <Text className="text-3xl mb-2">📊</Text>
              <Text className="text-white font-semibold text-sm text-center">
                Analytics
              </Text>
            </Pressable>
          </View>
        </View>

        {/* My Vehicles */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text
              className={`text-xl font-bold ${
                isDark ? "text-white" : "text-gray-800"
              }`}
            >
              My Vehicles
            </Text>
            <Pressable onPress={handleViewAllVehicles}>
              <Text className="text-blue-500 font-medium">View All</Text>
            </Pressable>
          </View>

          {vehicles.length === 0 ? (
            <View
              className={`rounded-2xl p-8 shadow-sm items-center ${
                isDark
                  ? "bg-gray-800 border border-gray-700"
                  : "bg-white border border-gray-100"
              }`}
            >
              <Text className="text-4xl mb-3">🚗</Text>
              <Text
                className={`font-medium text-center mb-2 ${
                  isDark ? "text-gray-200" : "text-gray-700"
                }`}
              >
                No vehicles yet
              </Text>
              <Text
                className={`text-sm text-center mb-4 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Add your first vehicle to start tracking maintenance
              </Text>
              <Pressable
                className="bg-blue-500 px-6 py-2 rounded-full"
                onPress={handleAddVehicle}
              >
                <Text className="text-white font-medium">Add Vehicle</Text>
              </Pressable>
            </View>
          ) : (
            <View className="space-y-4">
              {vehicles.slice(0, 2).map((vehicle) => {
                const nextServiceInfo = getNextService(vehicle);
                return (
                  <Pressable
                    key={vehicle.id}
                    className={`rounded-2xl p-5 shadow-sm ${
                      isDark
                        ? "bg-gray-800 border border-gray-700"
                        : "bg-white border border-gray-100"
                    }`}
                    onPress={() => handleViewVehicle(vehicle.id)}
                  >
                    <View className="flex-row items-center">
                      <View
                        className={`w-16 h-16 rounded-2xl justify-center items-center mr-4 ${
                          isDark ? "bg-blue-900/30" : "bg-blue-100"
                        }`}
                      >
                        <Text className="text-3xl">🚗</Text>
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text
                            className={`text-lg font-bold ${
                              isDark ? "text-white" : "text-gray-800"
                            }`}
                          >
                            {vehicle.make} {vehicle.model}
                          </Text>
                          <View
                            className={`w-3 h-3 rounded-full ${
                              getVehicleStatus(vehicle) === "good"
                                ? "bg-green-400"
                                : getVehicleStatus(vehicle) === "warning"
                                ? "bg-orange-400"
                                : "bg-red-400"
                            }`}
                          />
                        </View>

                        <Text
                          className={`text-sm mb-2 ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {vehicle.year} •{" "}
                          {vehicle.mileage
                            .toString()
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" "}
                          miles
                        </Text>

                        <View className="flex-row items-center">
                          <Text
                            className={`text-sm ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Next:{" "}
                          </Text>
                          <Text className="text-sm font-medium text-blue-600">
                            {nextServiceInfo.service}
                          </Text>
                          {nextServiceInfo.date && (
                            <Text
                              className={`text-sm ml-2 ${
                                isDark ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              ({nextServiceInfo.date})
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Upcoming Services */}
        <View className="px-6 mb-6">
          <Text
            className={`text-xl font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            Upcoming Services
          </Text>

          {upcomingServices.length === 0 ? (
            <View
              className={`rounded-2xl p-8 shadow-sm items-center ${
                isDark
                  ? "bg-gray-800 border border-gray-700"
                  : "bg-white border border-gray-100"
              }`}
            >
              <Text className="text-4xl mb-3">🔧</Text>
              <Text
                className={`font-medium text-center mb-2 ${
                  isDark ? "text-gray-200" : "text-gray-700"
                }`}
              >
                No upcoming services
              </Text>
              <Text
                className={`text-sm text-center ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                All caught up with maintenance!
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {upcomingServices.slice(0, 3).map((service) => {
                const vehicle = getVehicleForTask(service);
                const priority = getTaskPriority(service, vehicle);
                return (
                  <Pressable
                    key={service.id}
                    className={`rounded-xl p-4 shadow-sm ${
                      isDark
                        ? "bg-gray-800 border border-gray-700"
                        : "bg-white border border-gray-100"
                    }`}
                    onPress={() =>
                      router.push(
                        `../vehicles/maintenance/task/${service.id}?vehicleId=${service.vehicleId}`
                      )
                    }
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text
                          className={`text-base font-semibold ${
                            isDark ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {service.title}
                        </Text>
                        <Text
                          className={`text-sm mt-1 ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {vehicle
                            ? `${vehicle.make} ${vehicle.model}`
                            : "Unknown Vehicle"}
                        </Text>
                      </View>

                      <View className="items-end">
                        <Text
                          className={`text-sm font-medium ${
                            isDark ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {service.dueDate
                            ? formatDueDate(service)
                            : "Mileage based"}
                        </Text>
                        <View
                          className={`px-2 py-1 rounded-full mt-1 ${
                            priority === "high"
                              ? isDark
                                ? "bg-red-900/30"
                                : "bg-red-100"
                              : priority === "medium"
                              ? isDark
                                ? "bg-orange-900/30"
                                : "bg-orange-100"
                              : isDark
                              ? "bg-green-900/30"
                              : "bg-green-100"
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              priority === "high"
                                ? "text-red-600"
                                : priority === "medium"
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                          >
                            {priority}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Tips & Reminders */}
        <View className="px-6 mb-8">
          <Text
            className={`text-xl font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            Tips & Reminders
          </Text>

          <View
            className={`rounded-2xl p-5 border ${
              isDark
                ? "bg-blue-900/20 border-blue-800"
                : "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
            }`}
          >
            <View className="flex-row items-start">
              <Text className="text-2xl mr-3">💡</Text>
              <View className="flex-1">
                <Text
                  className={`font-semibold mb-1 ${
                    isDark ? "text-blue-400" : "text-blue-800"
                  }`}
                >
                  Maintenance Tip
                </Text>
                <Text
                  className={`text-sm leading-5 ${
                    isDark ? "text-blue-300" : "text-blue-700"
                  }`}
                >
                  Regular oil changes are crucial for engine health. Most
                  vehicles need an oil change every 5,000-7,500 miles depending
                  on driving conditions.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable
        className="absolute bottom-6 right-6 w-16 h-16 bg-blue-500 rounded-full justify-center items-center shadow-lg"
        onPress={handleQuickService}
      >
        <Text className="text-white text-2xl">+</Text>
      </Pressable>
    </View>
  );
};

export default HomeScreen;
