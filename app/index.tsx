import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import React from "react";
import { useRouter } from "expo-router";

const Index = () => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-blue-500 pt-12 pb-4 px-5">
        <Text className="text-white text-2xl font-bold">Home</Text>
        <Text className="text-blue-100 text-sm mt-1">Welcome back!</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Featured Section */}
        <View className="mb-6">
          <Text className="text-gray-800 text-lg font-semibold mb-3">
            Featured
          </Text>
          <View className="bg-blue-50 rounded-xl p-4 shadow-sm">
            <View className="flex-row items-center">
              <View className="h-16 w-16 bg-blue-200 rounded-full items-center justify-center">
                <Text className="text-blue-600 text-2xl">📱</Text>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-gray-800 font-bold text-lg">
                  Mobile App
                </Text>
                <Text className="text-gray-600 mt-1">
                  Explore the features of our app
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Access */}
        <Text className="text-gray-800 text-lg font-semibold mb-3">
          Quick Access
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {["Profile", "Settings", "Messages", "Tasks"].map((item, index) => (
            <TouchableOpacity
              key={index}
              className="bg-white rounded-xl p-4 mb-4 shadow-sm w-[48%] items-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 1,
                elevation: 1,
              }}
            >
              <View className="h-12 w-12 bg-blue-100 rounded-full items-center justify-center mb-2">
                <Text className="text-xl">
                  {item === "Profile"
                    ? "👤"
                    : item === "Settings"
                    ? "⚙️"
                    : item === "Messages"
                    ? "✉️"
                    : "📋"}
                </Text>
              </View>
              <Text className="text-gray-800 font-medium">{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <Text className="text-gray-800 text-lg font-semibold mb-3 mt-2">
          Recent Activity
        </Text>
        {[1, 2, 3].map((item) => (
          <View
            key={item}
            className="bg-white p-4 rounded-lg mb-3 shadow-sm border border-gray-100"
          >
            <View className="flex-row items-center">
              <View className="h-10 w-10 bg-gray-100 rounded-full items-center justify-center">
                <Text>🔔</Text>
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-gray-800 font-medium">
                  Activity {item}
                </Text>
                <Text className="text-gray-500 text-sm mt-1">
                  Yesterday at 2:30 PM
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="flex-row justify-around items-center bg-white py-3 border-t border-gray-200">
        {["Home", "Search", "Add", "Notifications", "Menu"].map(
          (item, index) => (
            <TouchableOpacity key={index} className="items-center">
              <View className="h-6 w-6 items-center justify-center mb-1">
                <Text>
                  {item === "Home"
                    ? "🏠"
                    : item === "Search"
                    ? "🔍"
                    : item === "Add"
                    ? "➕"
                    : item === "Notifications"
                    ? "🔔"
                    : "☰"}
                </Text>
              </View>
              <Text
                className={`text-xs ${
                  index === 0 ? "text-blue-500 font-medium" : "text-gray-500"
                }`}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
};

export default Index;
