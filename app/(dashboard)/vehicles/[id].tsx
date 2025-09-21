import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  createVehicleWithImage,
  getVehicleById,
  updateVehicleWithImage,
} from "@/services/vehicleService";
import { useLoader } from "@/context/LoaderContext";
import { useAuth } from "@/context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

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
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [shouldRemoveImage, setShouldRemoveImage] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

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
    try {
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
        mediaTypes: ["images"], // Updated to use string array
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6, // Reduced quality to make file smaller
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Show loading indicator
        setIsProcessingImage(true);

        try {
          // Get the URI of the selected image
          const selectedAsset = result.assets[0];

          // Store the local URI for processing during submission
          setLocalImageUri(selectedAsset.uri);

          // Show the selected image immediately (local preview)
          setImageUrl(selectedAsset.uri);

          // Reset remove flag if it was set
          setShouldRemoveImage(false);

          console.log("Image selected successfully:", selectedAsset.uri);
        } catch (error) {
          console.error("Error processing selected image:", error);
          Alert.alert(
            "Image Processing Warning",
            "The image was selected but may not be processed correctly. You can continue or try a different image."
          );
        } finally {
          setIsProcessingImage(false);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
      setIsProcessingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setLocalImageUri(null);
    setShouldRemoveImage(true);
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
      setIsSaving(true);
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
        // Don't include imageUrl here, it will be handled by the image processing functions
      };

      if (isNew) {
        // For new vehicles, use createVehicleWithImage
        await createVehicleWithImage(vehicleData, localImageUri || undefined);
      } else {
        // For existing vehicles, use updateVehicleWithImage
        await updateVehicleWithImage(
          id!,
          vehicleData,
          localImageUri || undefined,
          shouldRemoveImage
        );
      }

      // Return to vehicles list
      router.back();
    } catch (err: any) {
      console.error("Error saving vehicle:", err);

      // Provide more specific error messages
      if (err.message && err.message.includes("Image too large")) {
        Alert.alert(
          "Image Error",
          "The selected image is too large. Please choose a smaller image or reduce its quality."
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to save vehicle. The vehicle data was saved but there might have been an issue with the image."
        );
      }
    } finally {
      hideLoader();
      setIsSaving(false);
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
      <View className="flex-row items-center mb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4"
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold">
          {isNew ? "Add Vehicle" : "Edit Vehicle"}
        </Text>
      </View>

      {/* Image Section */}
      <View className="mb-6 items-center">
        <Text className="text-gray-700 mb-2 self-start">Vehicle Image</Text>

        {imageUrl ? (
          <View className="relative">
            <Image
              source={{ uri: imageUrl }}
              className="w-full h-48 rounded-lg"
              resizeMode="cover"
            />

            <TouchableOpacity
              onPress={handleRemoveImage}
              className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
            >
              <MaterialIcons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleImagePick}
            className="w-full h-48 bg-gray-200 rounded-lg items-center justify-center border-2 border-dashed border-gray-400"
          >
            <MaterialIcons name="add-a-photo" size={40} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2">Add Vehicle Image</Text>
          </TouchableOpacity>
        )}

        {imageUrl && (
          <TouchableOpacity
            onPress={handleImagePick}
            className="mt-2 flex-row items-center"
          >
            <MaterialIcons name="edit" size={18} color="#3B82F6" />
            <Text className="text-blue-500 ml-1">Change Image</Text>
          </TouchableOpacity>
        )}
      </View>

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
        disabled={isProcessingImage || isSaving}
      >
        {isProcessingImage || isSaving ? (
          <View className="flex-row justify-center items-center">
            <ActivityIndicator size="small" color="white" />
            <Text className="text-xl text-white text-center ml-2">
              {isProcessingImage ? "Processing Image..." : "Saving..."}
            </Text>
          </View>
        ) : (
          <Text className="text-xl text-white text-center">
            {isNew ? "Add Vehicle" : "Update Vehicle"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default VehicleFormScreen;
