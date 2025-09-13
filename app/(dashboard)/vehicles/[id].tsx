import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  createVehicle,
  getVehicleById,
  updateVehicle,
} from "@/services/vehicleService";
import { useLoader } from "@/context/LoaderContext";
import { useAuth } from "@/context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";

const fuelTypes = ["Gasoline", "Diesel", "Electric", "Hybrid", "Other"];

const VehicleFormScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isNew = !id || id === "new";
  const [make, setMake] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [vin, setVin] = useState<string>("");
  const [licensePlate, setLicensePlate] = useState<string>("");
  const [mileage, setMileage] = useState<string>("");
  const [fuelType, setFuelType] = useState<string>("Gasoline");
  const [engineType, setEngineType] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");

  const router = useRouter();
  const { hideLoader, showLoader } = useLoader();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    const load = async () => {
      if (!isNew && id && isAuthenticated) {
        try {
          showLoader();
          const vehicle = await getVehicleById(id);
          if (vehicle) {
            setMake(vehicle.make);
            setModel(vehicle.model);
            setYear(vehicle.year.toString());
            setVin(vehicle.vin || "");
            setLicensePlate(vehicle.licensePlate || "");
            setMileage(vehicle.mileage.toString());
            setFuelType(vehicle.fuelType || "Gasoline");
            setEngineType(vehicle.engineType || "");
            setImageUrl(vehicle.imageUrl || "");
          }
        } catch (error) {
          console.error("Error loading vehicle:", error);
          Alert.alert("Error", "Failed to load vehicle");
        } finally {
          hideLoader();
        }
      }
    };

    if (!loading) {
      load();
    }
  }, [id, isAuthenticated, loading]);

  const handleImagePick = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to grant permission to access your photos"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUrl(result.assets[0].uri);
      // In a real app, you would upload this to your storage service
      // and then store the returned URL
    }
  };

  const validateForm = () => {
    if (!make.trim()) return "Make is required";
    if (!model.trim()) return "Model is required";
    if (!year.trim() || isNaN(Number(year))) return "Valid year is required";
    if (!mileage.trim() || isNaN(Number(mileage)))
      return "Valid mileage is required";
    if (Number(mileage) < 0) return "Mileage cannot be negative";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert("Validation Error", validationError);
      return;
    }

    if (!isAuthenticated) {
      Alert.alert("Error", "You must be logged in to save vehicles");
      return;
    }

    try {
      showLoader();
      const vehicleData = {
        make,
        model,
        year: parseInt(year),
        vin: vin.trim() || undefined,
        licensePlate: licensePlate.trim() || undefined,
        mileage: parseInt(mileage),
        fuelType,
        engineType: engineType.trim() || undefined,
        imageUrl: imageUrl || undefined,
      };

      if (isNew) {
        await createVehicle(vehicleData);
      } else {
        await updateVehicle(id!, vehicleData);
      }
      router.back();
    } catch (err) {
      console.error("Error saving vehicle:", err);
      Alert.alert("Error", "Failed to save vehicle");
    } finally {
      hideLoader();
    }
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
        <Text className="text-lg">Please log in to manage vehicles</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 w-full p-5">
      <Text className="text-2xl font-bold mb-4">
        {isNew ? "Add Vehicle" : "Edit Vehicle"}
      </Text>

      <TouchableOpacity
        onPress={handleImagePick}
        className="mb-4 items-center justify-center"
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-48 rounded-lg"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-32 bg-gray-200 rounded-lg items-center justify-center">
            <Text className="text-gray-500">Add Vehicle Image</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text className="text-gray-700 mb-1">Make*</Text>
      <TextInput
        className="border border-gray-400 p-2 mb-3 rounded-md"
        placeholder="e.g. Toyota"
        value={make}
        onChangeText={setMake}
      />

      <Text className="text-gray-700 mb-1">Model*</Text>
      <TextInput
        className="border border-gray-400 p-2 mb-3 rounded-md"
        placeholder="e.g. Camry"
        value={model}
        onChangeText={setModel}
      />

      <Text className="text-gray-700 mb-1">Year*</Text>
      <TextInput
        className="border border-gray-400 p-2 mb-3 rounded-md"
        placeholder="e.g. 2022"
        value={year}
        onChangeText={setYear}
        keyboardType="numeric"
      />

      <Text className="text-gray-700 mb-1">Current Mileage*</Text>
      <TextInput
        className="border border-gray-400 p-2 mb-3 rounded-md"
        placeholder="e.g. 15000"
        value={mileage}
        onChangeText={setMileage}
        keyboardType="numeric"
      />

      <Text className="text-gray-700 mb-1">VIN (Optional)</Text>
      <TextInput
        className="border border-gray-400 p-2 mb-3 rounded-md"
        placeholder="Vehicle Identification Number"
        value={vin}
        onChangeText={setVin}
      />

      <Text className="text-gray-700 mb-1">License Plate (Optional)</Text>
      <TextInput
        className="border border-gray-400 p-2 mb-3 rounded-md"
        placeholder="License Plate Number"
        value={licensePlate}
        onChangeText={setLicensePlate}
      />

      <Text className="text-gray-700 mb-1">Fuel Type</Text>
      <View className="border border-gray-400 rounded-md mb-3">
        <Picker
          selectedValue={fuelType}
          onValueChange={(itemValue: string) => setFuelType(itemValue)}
        >
          {fuelTypes.map((type) => (
            <Picker.Item key={type} label={type} value={type} />
          ))}
        </Picker>
      </View>

      <Text className="text-gray-700 mb-1">Engine Type (Optional)</Text>
      <TextInput
        className="border border-gray-400 p-2 mb-3 rounded-md"
        placeholder="e.g. V6, Inline-4"
        value={engineType}
        onChangeText={setEngineType}
      />

      <TouchableOpacity
        className="bg-blue-500 rounded-md px-6 py-3 my-4"
        onPress={handleSubmit}
      >
        <Text className="text-xl text-white text-center">
          {isNew ? "Add Vehicle" : "Update Vehicle"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default VehicleFormScreen;
