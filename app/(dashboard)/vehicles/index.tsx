import { useLoader } from "@/context/LoaderContext";
import { useAuth } from "@/context/AuthContext";
import {
  getAllVehicles,
  getUserVehiclesColRef,
  deleteVehicle,
} from "@/services/vehicleService";
import { Vehicle } from "@/types/vehicle";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
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
    // Fix: Use the correct path format for Expo Router
    router.push(`../vehicles/maintenance/${vehicleId}`);
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
    <View className="flex-1 w-full bg-white relative">
      <Text className="text-3xl text-center text-blue-900 font-extrabold mb-6 mt-10 tracking-tight">
        My Vehicles
      </Text>

      <Pressable
        className="absolute bottom-10 right-6 bg-blue-600 rounded-full p-4 shadow-2xl z-40"
        onPress={() => router.push("../vehicles/new")}
        style={{ elevation: 8 }}
      >
        <MaterialIcons name="add" size={30} color="#fff" />
      </Pressable>

      <ScrollView
        className="flex-1 w-full px-5 pt-4 pb-28"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {vehicles.length === 0 && (
          <View className="py-24 items-center justify-center">
            <Text className="text-gray-500 text-xl font-medium">
              No vehicles found. Add your first vehicle!
            </Text>
          </View>
        )}
        {vehicles.map((vehicle) => (
          <View
            key={vehicle.id}
            className="mb-5 rounded-2xl bg-white shadow-lg overflow-hidden border border-gray-200"
          >
            {vehicle.imageUrl ? (
              <Image
                source={{ uri: vehicle.imageUrl }}
                className="w-full h-48"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-24 bg-gray-200 items-center justify-center">
                <MaterialIcons name="directions-car" size={48} color="#666" />
              </View>
            )}

            <View className="p-6">
              <Text className="text-xl font-semibold text-blue-900 mb-1 tracking-wide">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>

              <View className="flex-row flex-wrap my-2">
                <View className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2">
                  <Text className="text-sm text-gray-800">
                    Mileage: {formatMileage(vehicle.mileage)} mi
                  </Text>
                </View>

                {vehicle.fuelType && (
                  <View className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2">
                    <Text className="text-sm text-gray-800">
                      {vehicle.fuelType}
                    </Text>
                  </View>
                )}

                {vehicle.licensePlate && (
                  <View className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2">
                    <Text className="text-sm text-gray-800">
                      Plate: {vehicle.licensePlate}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row space-x-3 mt-4">
                <TouchableOpacity
                  className="flex-1 bg-green-600 px-3 py-2.5 rounded-lg shadow-md"
                  onPress={() => navigateToMaintenance(vehicle.id)}
                >
                  <Text className="text-white font-medium text-base text-center">
                    Maintenance
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-blue-500 px-3 py-2.5 rounded-lg shadow-md"
                  onPress={() => router.push(`../vehicles/${vehicle.id}`)}
                >
                  <Text className="text-white font-medium text-base">Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-red-500 px-3 py-2.5 rounded-lg shadow-md"
                  onPress={() => vehicle.id && handleDelete(vehicle.id)}
                >
                  <Text className="text-white font-medium text-base">
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default VehicleScreen;
