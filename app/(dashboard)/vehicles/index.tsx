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
  StatusBar,
  RefreshControl,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VehicleCard = React.memo(
  ({
    vehicle,
    onEdit,
    onDelete,
    onMaintenance,
  }: {
    vehicle: Vehicle;
    onEdit: () => void;
    onDelete: () => void;
    onMaintenance: () => void;
  }) => {
    const formatMileage = (mileage: number) => {
      return mileage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    return (
      <View className="mb-4">
        <View
          className="bg-white rounded-3xl overflow-hidden"
          style={{
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {/* Main Card Content */}
          <View className="p-5">
            <View className="flex-row items-center">
              {/* Vehicle Image */}
              <View className="w-16 h-16 rounded-2xl bg-gray-50 justify-center items-center mr-4 overflow-hidden">
                {vehicle.imageUrl ? (
                  <Image
                    source={{ uri: vehicle.imageUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialIcons
                    name="directions-car"
                    size={28}
                    color="#000000"
                  />
                )}
              </View>

              {/* Vehicle Info */}
              <View className="flex-1">
                <View className="flex-row justify-between items-start">
                  <View>
                    <Text className="text-xs font-medium text-gray-500 mb-0.5">
                      {vehicle.year}
                    </Text>
                    <Text className="text-lg font-bold text-black">
                      {vehicle.make} {vehicle.model}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={onEdit}
                      className="p-2 rounded-full bg-gray-50 mr-2"
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="edit" size={16} color="#000000" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={onDelete}
                      className="p-2 rounded-full bg-gray-50"
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="delete" size={16} color="#000000" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Vehicle Details Row */}
                <View className="flex-row items-center mt-2">
                  {vehicle.licensePlate && (
                    <View className="bg-black px-2.5 py-1 rounded-lg mr-2">
                      <Text className="text-white text-xs font-semibold tracking-wide">
                        {vehicle.licensePlate}
                      </Text>
                    </View>
                  )}

                  <Text className="text-sm font-medium text-gray-900">
                    {formatMileage(vehicle.mileage)} mi
                  </Text>

                  {vehicle.fuelType && (
                    <>
                      <Text className="text-gray-300 mx-2">•</Text>
                      <Text className="text-sm text-gray-600 capitalize">
                        {vehicle.fuelType}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* Maintenance Button */}
            <TouchableOpacity
              className="bg-gray-50 mt-4 py-3 rounded-2xl flex-row items-center justify-center"
              onPress={onMaintenance}
              activeOpacity={0.7}
            >
              <MaterialIcons name="build" size={16} color="#000000" />
              <Text className="text-black font-medium ml-2 text-sm">
                Maintenance Records
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
);

const EmptyState = React.memo(() => {
  return (
    <View className="py-24 items-center justify-center">
      <View className="w-24 h-24 rounded-full bg-gray-50 items-center justify-center mb-6">
        <MaterialIcons name="directions-car" size={40} color="#000000" />
      </View>
      <Text className="text-black text-lg font-bold mb-2">No vehicles yet</Text>
      <Text className="text-gray-600 text-sm text-center px-8">
        Add your first vehicle to start tracking maintenance
      </Text>
    </View>
  );
});

const VehicleScreen = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const { user, loading, isAuthenticated } = useAuth();

  const loadVehicles = async () => {
    if (!isAuthenticated || !user) return;

    try {
      showLoader();
      const vehiclesColRef = await getUserVehiclesColRef();

      return onSnapshot(
        vehiclesColRef,
        (snapshot) => {
          const vehicleData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Vehicle[];
          setVehicles(vehicleData);
          hideLoader();
          setRefreshing(false);
        },
        (error) => {
          console.error("Firestore error:", error);
          hideLoader();
          setRefreshing(false);
          Alert.alert("Error", "Failed to load vehicles");
        }
      );
    } catch (error) {
      console.error("Setup error:", error);
      hideLoader();
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      let unsubscribe: (() => void) | undefined;

      const setupListener = async () => {
        unsubscribe = await loadVehicles();
      };

      setupListener();

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [user, loading, isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    loadVehicles();
  };

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

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 justify-center items-center bg-gray-50"
        edges={["top", "left", "right"]}
      >
        <Text className="text-base font-medium text-black">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView
        className="flex-1 justify-center items-center bg-gray-50 px-8"
        edges={["top", "left", "right"]}
      >
        <Text className="text-lg font-semibold text-black text-center">
          Please log in to view your vehicles
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <SafeAreaView
        style={{ flex: 0, backgroundColor: "white" }}
        edges={["top"]}
      />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#F9FAFB" }}
        edges={["left", "right", "bottom"]}
      >
        {/* Header */}
        <View className="bg-white px-5 py-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <TouchableOpacity
                onPress={() => router.back()}
                className="mr-3 p-2"
                activeOpacity={0.7}
              >
                <MaterialIcons name="arrow-back" size={24} color="#000000" />
              </TouchableOpacity>
              <View>
                <Text className="text-xl font-bold text-black">
                  My Vehicles
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {vehicles.length}{" "}
                  {vehicles.length === 1 ? "vehicle" : "vehicles"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push("../vehicles/new")}
              className="w-10 h-10 bg-black rounded-full justify-center items-center"
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle List */}
        <ScrollView
          className="flex-1 px-5 py-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#000000"]}
              tintColor="#000000"
              progressBackgroundColor="#FAFAFA"
            />
          }
        >
          {vehicles.length === 0 ? (
            <EmptyState />
          ) : (
            vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onEdit={() => router.push(`../vehicles/${vehicle.id}`)}
                onDelete={() => vehicle.id && handleDelete(vehicle.id)}
                onMaintenance={() => navigateToMaintenance(vehicle.id)}
              />
            ))
          )}

          {/* Bottom spacing */}
          <View className="h-4" />
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default VehicleScreen;
