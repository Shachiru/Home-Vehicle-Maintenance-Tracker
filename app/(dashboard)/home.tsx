import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";

const HomeScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - replace with real data from your backend
  const vehicles = [
    {
      id: 1,
      name: "Honda Civic",
      year: "2022",
      mileage: "45,200",
      nextService: "Oil Change",
      dueDate: "Jan 25, 2025",
      status: "good",
      image: "🚗",
    },
    {
      id: 2,
      name: "Toyota Camry",
      year: "2020",
      mileage: "67,800",
      nextService: "Tire Rotation",
      dueDate: "Jan 18, 2025",
      status: "warning",
      image: "🚙",
    },
  ];

  const upcomingServices = [
    {
      id: 1,
      service: "Oil Change",
      vehicle: "Honda Civic",
      date: "Jan 25",
      priority: "medium",
    },
    {
      id: 2,
      service: "Tire Rotation",
      vehicle: "Toyota Camry",
      date: "Jan 18",
      priority: "high",
    },
    {
      id: 3,
      service: "Brake Inspection",
      vehicle: "Honda Civic",
      date: "Feb 05",
      priority: "low",
    },
  ];

  const quickStats = {
    totalVehicles: 2,
    upcomingServices: 3,
    completedThisMonth: 5,
    totalMaintenance: 127,
  };

  const handleAddVehicle = () => {
    // Navigate to add vehicle screen
    console.log("Add vehicle");
  };

  const handleViewVehicle = (vehicleId: number) => {
    // Navigate to vehicle details
    console.log("View vehicle:", vehicleId);
  };

  const handleQuickService = () => {
    // Navigate to quick service log
    console.log("Quick service");
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-gradient-to-r from-blue-500 to-blue-600 pt-14 pb-6 px-6 shadow-lg">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-white text-2xl font-bold">Welcome back!</Text>
            <Text className="text-blue-100 text-base mt-1">
              Track your vehicle maintenance
            </Text>
          </View>
          <Pressable className="w-12 h-12 bg-white/20 rounded-full justify-center items-center">
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
          <View className="bg-white rounded-2xl p-6 shadow-md">
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-blue-600">
                  {quickStats.totalVehicles}
                </Text>
                <Text className="text-sm text-gray-600 mt-1 text-center">
                  Vehicles
                </Text>
              </View>
              <View className="w-px h-12 bg-gray-200" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-orange-500">
                  {quickStats.upcomingServices}
                </Text>
                <Text className="text-sm text-gray-600 mt-1 text-center">
                  Due Soon
                </Text>
              </View>
              <View className="w-px h-12 bg-gray-200" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-green-500">
                  {quickStats.completedThisMonth}
                </Text>
                <Text className="text-sm text-gray-600 mt-1 text-center">
                  This Month
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">
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

            <Pressable className="bg-purple-500 rounded-2xl p-4 flex-1 ml-2 items-center shadow-sm">
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
            <Text className="text-xl font-bold text-gray-800">My Vehicles</Text>
            <Pressable>
              <Text className="text-blue-500 font-medium">View All</Text>
            </Pressable>
          </View>

          <View className="space-y-4">
            {vehicles.map((vehicle) => (
              <Pressable
                key={vehicle.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                onPress={() => handleViewVehicle(vehicle.id)}
              >
                <View className="flex-row items-center">
                  <View className="w-16 h-16 bg-blue-100 rounded-2xl justify-center items-center mr-4">
                    <Text className="text-3xl">{vehicle.image}</Text>
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-lg font-bold text-gray-800">
                        {vehicle.name}
                      </Text>
                      <View
                        className={`w-3 h-3 rounded-full ${
                          vehicle.status === "good"
                            ? "bg-green-400"
                            : vehicle.status === "warning"
                            ? "bg-orange-400"
                            : "bg-red-400"
                        }`}
                      />
                    </View>

                    <Text className="text-sm text-gray-500 mb-2">
                      {vehicle.year} • {vehicle.mileage} miles
                    </Text>

                    <View className="flex-row items-center">
                      <Text className="text-sm text-gray-600">Next: </Text>
                      <Text className="text-sm font-medium text-blue-600">
                        {vehicle.nextService}
                      </Text>
                      <Text className="text-sm text-gray-500 ml-2">
                        ({vehicle.dueDate})
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Upcoming Services */}
        <View className="px-6 mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Upcoming Services
          </Text>

          <View className="space-y-3">
            {upcomingServices.map((service) => (
              <View
                key={service.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-800">
                      {service.service}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1">
                      {service.vehicle}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-sm font-medium text-gray-800">
                      {service.date}
                    </Text>
                    <View
                      className={`px-2 py-1 rounded-full mt-1 ${
                        service.priority === "high"
                          ? "bg-red-100"
                          : service.priority === "medium"
                          ? "bg-orange-100"
                          : "bg-green-100"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          service.priority === "high"
                            ? "text-red-600"
                            : service.priority === "medium"
                            ? "text-orange-600"
                            : "text-green-600"
                        }`}
                      >
                        {service.priority}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-6 mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Recent Activity
          </Text>

          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <View className="items-center py-8">
              <Text className="text-4xl mb-3">📝</Text>
              <Text className="text-gray-600 text-center">
                No recent activity
              </Text>
              <Text className="text-sm text-gray-500 text-center mt-1">
                Start logging your vehicle maintenance
              </Text>
            </View>
          </View>
        </View>

        {/* Tips & Reminders */}
        <View className="px-6 mb-8">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Tips & Reminders
          </Text>

          <View className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200">
            <View className="flex-row items-start">
              <Text className="text-2xl mr-3">💡</Text>
              <View className="flex-1">
                <Text className="text-blue-800 font-semibold mb-1">
                  Winter Maintenance Tip
                </Text>
                <Text className="text-blue-700 text-sm leading-5">
                  Check your tire pressure regularly during cold weather.
                  Temperature drops can reduce tire pressure by 1-2 PSI.
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
