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
  RefreshControl,
  Animated,
  Pressable,
} from "react-native";

const VehicleCard = React.memo(
  ({
    vehicle,
    onEdit,
    onDelete,
    onMaintenance,
    index,
  }: {
    vehicle: Vehicle;
    onEdit: () => void;
    onDelete: () => void;
    onMaintenance: () => void;
    index: number;
  }) => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;
    const fadeAnim = React.useRef(new Animated.Value(1)).current; // Start at 1 for immediate visibility
    const [hasAnimated, setHasAnimated] = React.useState(false);

    React.useEffect(() => {
      // Only animate on first mount, not on tab switches
      if (!hasAnimated) {
        // Start from 0 and animate to 1
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          delay: Math.min(index * 80, 400), // Cap the delay
          useNativeDriver: true,
        }).start(() => {
          setHasAnimated(true);
        });
      }
    }, [fadeAnim, index, hasAnimated]);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    };

    const formatMileage = (mileage: number) => {
      return mileage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
        className="mb-6"
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className="bg-white rounded-2xl overflow-hidden"
          style={{
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* Main Card Content */}
          <View className="p-6">
            <View className="flex-row items-start">
              {/* Vehicle Image */}
              <View
                className="w-20 h-20 rounded-xl bg-gray-50 justify-center items-center mr-4 overflow-hidden"
                style={{
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {vehicle.imageUrl ? (
                  <Image
                    source={{ uri: vehicle.imageUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialIcons
                    name="directions-car"
                    size={32}
                    color="#9CA3AF"
                  />
                )}
              </View>

              {/* Vehicle Info */}
              <View className="flex-1">
                <View className="flex-row justify-between items-start mb-2">
                  <View>
                    <Text className="text-sm font-medium text-gray-500 mb-1">
                      {vehicle.year}
                    </Text>
                    <Text className="text-xl font-bold text-gray-900 leading-tight">
                      {vehicle.make}
                    </Text>
                    <Text className="text-lg font-semibold text-gray-700">
                      {vehicle.model}
                    </Text>
                  </View>

                  {/* Status Badge */}
                  <View className="bg-gray-100 px-3 py-1 rounded-full">
                    <Text className="text-xs font-medium text-gray-600">
                      ACTIVE
                    </Text>
                  </View>
                </View>

                {/* License Plate */}
                {vehicle.licensePlate && (
                  <View className="bg-gray-900 px-3 py-1 rounded-md self-start mb-3">
                    <Text className="text-white text-xs font-bold tracking-wider">
                      {vehicle.licensePlate}
                    </Text>
                  </View>
                )}

                {/* Vehicle Details */}
                <View className="flex-row flex-wrap">
                  <View className="bg-gray-50 px-3 py-1.5 rounded-lg mr-2 mb-2">
                    <Text className="text-sm font-semibold text-gray-800">
                      {formatMileage(vehicle.mileage)} mi
                    </Text>
                  </View>

                  {vehicle.fuelType && (
                    <View className="bg-gray-50 px-3 py-1.5 rounded-lg mr-2 mb-2">
                      <Text className="text-sm text-gray-700 capitalize">
                        {vehicle.fuelType}
                      </Text>
                    </View>
                  )}

                  {vehicle.engineType && (
                    <View className="bg-gray-50 px-3 py-1.5 rounded-lg mr-2 mb-2">
                      <Text className="text-sm text-gray-700">
                        {vehicle.engineType}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="border-t border-gray-100">
            <TouchableOpacity
              className="bg-gray-900 py-4 px-6 flex-row items-center justify-center"
              onPress={onMaintenance}
              activeOpacity={0.8}
            >
              <MaterialIcons name="build" size={20} color="white" />
              <Text className="text-white font-semibold ml-2 text-base">
                Maintenance Records
              </Text>
              <MaterialIcons
                name="arrow-forward-ios"
                size={16}
                color="white"
                className="ml-2"
              />
            </TouchableOpacity>

            <View className="flex-row border-t border-gray-100">
              <TouchableOpacity
                className="flex-1 py-3 px-4 flex-row items-center justify-center bg-gray-50"
                onPress={onEdit}
                activeOpacity={0.7}
              >
                <MaterialIcons name="edit" size={18} color="#374151" />
                <Text className="text-gray-700 font-medium ml-2">Edit</Text>
              </TouchableOpacity>

              <View className="w-px bg-gray-200" />

              <TouchableOpacity
                className="flex-1 py-3 px-4 flex-row items-center justify-center bg-gray-50"
                onPress={onDelete}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={18}
                  color="#DC2626"
                />
                <Text className="text-red-600 font-medium ml-2">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }
);

const EmptyState = React.memo(() => {
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const translateY = React.useRef(new Animated.Value(0)).current;
  const [hasAnimated, setHasAnimated] = React.useState(false);

  React.useEffect(() => {
    if (!hasAnimated) {
      fadeAnim.setValue(0);
      translateY.setValue(20);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setHasAnimated(true);
      });
    }
  }, [fadeAnim, translateY, hasAnimated]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }],
      }}
      className="py-24 items-center justify-center"
    >
      <View
        className="w-32 h-32 rounded-full bg-gray-50 items-center justify-center mb-6"
        style={{
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <MaterialIcons name="directions-car" size={48} color="#9CA3AF" />
      </View>
      <Text className="text-gray-900 text-xl font-bold mb-2">
        No vehicles yet
      </Text>
      <Text className="text-gray-500 text-base text-center px-8 leading-relaxed">
        Add your first vehicle to start tracking maintenance and records
      </Text>
    </Animated.View>
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
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg font-medium text-gray-600">Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-8">
        <Text className="text-xl font-semibold text-gray-900 text-center">
          Please log in to view your vehicles
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View
        className="bg-white px-6 py-4 border-b border-gray-100"
        style={{
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 p-2 rounded-full bg-gray-50"
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-gray-900">
                My Vehicles
              </Text>
              <Text className="text-sm text-gray-500 mt-0.5">
                {vehicles.length}{" "}
                {vehicles.length === 1 ? "vehicle" : "vehicles"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push("../vehicles/new")}
            className="w-11 h-11 bg-gray-900 rounded-full justify-center items-center"
            activeOpacity={0.8}
            style={{
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <MaterialIcons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Vehicle List */}
      <ScrollView
        className="flex-1 px-6 py-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#374151"]}
            tintColor="#374151"
            progressBackgroundColor="#F3F4F6"
          />
        }
      >
        {vehicles.length === 0 ? (
          <EmptyState />
        ) : (
          vehicles.map((vehicle, index) => (
            <VehicleCard
              key={`${vehicle.id}-${vehicle.year}-${vehicle.make}`} // More stable key
              vehicle={vehicle}
              index={index}
              onEdit={() => router.push(`../vehicles/${vehicle.id}`)}
              onDelete={() => vehicle.id && handleDelete(vehicle.id)}
              onMaintenance={() => navigateToMaintenance(vehicle.id)}
            />
          ))
        )}

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default VehicleScreen;
