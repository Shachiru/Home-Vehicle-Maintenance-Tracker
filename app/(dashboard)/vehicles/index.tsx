import { useLoader } from "@/context/LoaderContext";
import { useAuth } from "@/context/AuthContext";
import {
  getAllVehicles,
  getUserVehiclesColRef,
  deleteVehicle,
} from "@/services/vehicleService";
import { Vehicle } from "@/types/vehicle";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
} from "react-native";

const VehicleScreen = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      let unsubscribe: (() => void) | undefined;

      const setupListener = async () => {
        try {
          showLoader();
          const vehiclesColRef = await getUserVehiclesColRef();

          unsubscribe = onSnapshot(
            vehiclesColRef,
            (snapshot) => {
              const vehicleData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })) as Vehicle[];
              setVehicles(vehicleData);
              hideLoader();
            },
            (error) => {
              console.error("Firestore error:", error);
              hideLoader();
              Alert.alert("Error", "Failed to load vehicles");
            }
          );
        } catch (error) {
          console.error("Setup error:", error);
          hideLoader();
        }
      };

      setupListener();

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [user, loading, isAuthenticated]);

  const handleDelete = (vehicleId: string) => {
    Alert.alert(
      "Delete Vehicle",
      "Are you sure you want to delete this vehicle? All maintenance records will also be deleted.",
      [
        { text: "Cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              showLoader();
              await deleteVehicle(vehicleId);
            } catch (error) {
              console.error("Error deleting vehicle:", error);
              Alert.alert("Error", "Failed to delete vehicle");
            } finally {
              hideLoader();
            }
          },
        },
      ]
    );
  };

  const navigateToMaintenance = (vehicleId: string) => {
    router.push(`/vehicles/maintenance/${vehicleId}`);
  };

  const formatMileage = (mileage: number) => {
    return mileage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg">Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg">Please log in to view your vehicles</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">My Vehicles</Text>
        <TouchableOpacity
          onPress={() => router.push("../vehicles/new")}
          className="w-10 h-10 justify-center items-center"
        >
          <MaterialIcons name="add" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Vehicle List */}
      <ScrollView
        className="flex-1 px-4 py-4"
        showsVerticalScrollIndicator={false}
      >
        {vehicles.length === 0 && (
          <View className="py-24 items-center justify-center">
            <MaterialIcons name="directions-car" size={64} color="#CBD5E1" />
            <Text className="text-gray-500 text-base font-medium mt-4">
              No vehicles found. Add your first vehicle!
            </Text>
          </View>
        )}

        {vehicles.map((vehicle) => (
          <View
            key={vehicle.id}
            className="mb-5 rounded-xl bg-white shadow-md overflow-hidden"
          >
            <View className="flex-row">
              {/* Vehicle Image */}
              <View className="w-28 h-28 bg-gray-100 justify-center items-center">
                {vehicle.imageUrl ? (
                  <Image
                    source={{ uri: vehicle.imageUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialIcons
                    name="directions-car"
                    size={44}
                    color="#9CA3AF"
                  />
                )}
              </View>

              {/* Vehicle Details */}
              <View className="flex-1 p-4">
                <View className="flex-row justify-between items-start">
                  <View>
                    <Text className="text-gray-600 text-sm">
                      {vehicle.year}
                    </Text>
                    <Text className="text-xl font-bold text-gray-900">
                      {vehicle.make} {vehicle.model}
                    </Text>
                  </View>
                </View>

                {vehicle.licensePlate && (
                  <Text className="text-gray-500 mt-1">
                    License Plate: {vehicle.licensePlate}
                  </Text>
                )}

                <View className="flex-row flex-wrap mt-1">
                  <Text className="text-gray-500">
                    {formatMileage(vehicle.mileage)} miles
                  </Text>

                  {vehicle.fuelType && (
                    <Text className="text-gray-500 ml-2">
                      • {vehicle.fuelType}
                    </Text>
                  )}

                  {vehicle.engineType && (
                    <Text className="text-gray-500 ml-2">
                      • {vehicle.engineType}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row items-center border-t border-gray-100">
              <TouchableOpacity
                className="flex-1 py-3 px-4 flex-row items-center justify-center bg-gray-900"
                onPress={() => navigateToMaintenance(vehicle.id)}
              >
                <Text className="text-white font-medium mr-1">
                  Vehicle Maintenance
                </Text>
                <MaterialIcons name="arrow-forward" size={16} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                className="py-3 px-4 border-l border-gray-100"
                onPress={() => router.push(`../vehicles/${vehicle.id}`)}
              >
                <MaterialIcons name="edit" size={20} color="#4B5563" />
              </TouchableOpacity>

              <TouchableOpacity
                className="py-3 px-4 border-l border-gray-100"
                onPress={() => vehicle.id && handleDelete(vehicle.id)}
              >
                <MaterialIcons name="delete" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Space at bottom to ensure last card isn't covered by bottom tab */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default VehicleScreen;
