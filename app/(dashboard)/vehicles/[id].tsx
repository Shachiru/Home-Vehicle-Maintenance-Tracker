import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
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
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsProcessingImage(true);

        try {
          const selectedAsset = result.assets[0];
          setLocalImageUri(selectedAsset.uri);
          setImageUrl(selectedAsset.uri);
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
      };

      if (isNew) {
        await createVehicleWithImage(vehicleData, localImageUri || undefined);
      } else {
        await updateVehicleWithImage(
          id!,
          vehicleData,
          localImageUri || undefined,
          shouldRemoveImage
        );
      }

      router.back();
    } catch (err: any) {
      console.error("Error saving vehicle:", err);

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
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#374151" />
          <Text className="text-base mt-3 text-gray-800 font-medium">
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <View className="flex-1 justify-center items-center px-8">
          <View
            className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4"
            style={{
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <MaterialIcons name="lock-outline" size={32} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            Authentication Required
          </Text>
          <Text className="text-base text-gray-600 text-center leading-relaxed">
            Please log in to manage your vehicles
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Section */}
        <View className="px-6 pt-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Vehicle Photo
          </Text>

          {imageUrl ? (
            <View
              className="relative mb-6"
              style={{
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Image
                source={{ uri: imageUrl }}
                className="w-full h-48 rounded-2xl bg-gray-100"
                resizeMode="cover"
              />

              <TouchableOpacity
                onPress={handleRemoveImage}
                className="absolute top-3 right-3 w-8 h-8 bg-gray-900/90 rounded-full justify-center items-center"
                activeOpacity={0.8}
              >
                <MaterialIcons name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleImagePick}
                className="absolute bottom-3 right-3 px-3 py-2 bg-gray-900/90 rounded-xl flex-row items-center"
                activeOpacity={0.8}
              >
                <MaterialIcons name="edit" size={14} color="#FFFFFF" />
                <Text className="text-white text-sm font-medium ml-2">
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleImagePick}
              className="w-full h-48 bg-white rounded-2xl border-2 border-dashed border-gray-300 justify-center items-center mb-6"
              activeOpacity={0.7}
              style={{
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <MaterialIcons name="add-a-photo" size={32} color="#9CA3AF" />
              <Text className="text-gray-700 text-base font-semibold mt-3">
                Add Vehicle Photo
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                Tap to select from gallery
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Form Fields */}
        <View className="px-6">
          {/* Essential Information */}
          <View className="mb-8">
            <Text className="text-lg font-bold text-gray-900 mb-5">
              Essential Information
            </Text>

            {/* Make and Model Row */}
            <View className="flex-row mb-5">
              <View className="flex-1 mr-3">
                <Text className="text-sm font-semibold text-gray-800 mb-2">
                  Make *
                </Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900 bg-white"
                  placeholder="Toyota"
                  placeholderTextColor="#9CA3AF"
                  value={make}
                  onChangeText={setMake}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 0,
                      height: 1,
                    },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                />
              </View>

              <View className="flex-1 ml-3">
                <Text className="text-sm font-semibold text-gray-800 mb-2">
                  Model *
                </Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900 bg-white"
                  placeholder="Camry"
                  placeholderTextColor="#9CA3AF"
                  value={model}
                  onChangeText={setModel}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 0,
                      height: 1,
                    },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                />
              </View>
            </View>

            {/* Year and Mileage Row */}
            <View className="flex-row mb-5">
              <View className="flex-1 mr-3">
                <Text className="text-sm font-semibold text-gray-800 mb-2">
                  Year *
                </Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900 bg-white"
                  placeholder="2024"
                  placeholderTextColor="#9CA3AF"
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 0,
                      height: 1,
                    },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                />
              </View>

              <View className="flex-1 ml-3">
                <Text className="text-sm font-semibold text-gray-800 mb-2">
                  Mileage *
                </Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900 bg-white"
                  placeholder="15,000"
                  placeholderTextColor="#9CA3AF"
                  value={mileage}
                  onChangeText={setMileage}
                  keyboardType="numeric"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 0,
                      height: 1,
                    },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                />
              </View>
            </View>

            {/* Fuel Type */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-800 mb-2">
                Fuel Type
              </Text>
              <View
                className="border border-gray-200 rounded-xl bg-white overflow-hidden"
                style={{
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 1,
                  },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <Picker
                  selectedValue={fuelType}
                  onValueChange={(itemValue: string) => setFuelType(itemValue)}
                  style={{ height: 56 }}
                >
                  {fuelTypes.map((type) => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          {/* Additional Information */}
          <View className="mb-8">
            <Text className="text-lg font-bold text-gray-900 mb-5">
              Additional Information
            </Text>

            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-800 mb-2">
                VIN
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900 bg-white"
                placeholder="Vehicle Identification Number"
                placeholderTextColor="#9CA3AF"
                value={vin}
                onChangeText={setVin}
                style={{
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 1,
                  },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-800 mb-2">
                License Plate
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900 bg-white"
                placeholder="ABC-1234"
                placeholderTextColor="#9CA3AF"
                value={licensePlate}
                onChangeText={setLicensePlate}
                style={{
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 1,
                  },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-800 mb-2">
                Engine Type
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900 bg-white"
                placeholder="V6, Inline-4, Electric Motor"
                placeholderTextColor="#9CA3AF"
                value={engineType}
                onChangeText={setEngineType}
                style={{
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 1,
                  },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white px-6 py-6 border-t border-gray-200"
        style={{
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 8,
        }}
      >
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isProcessingImage || isSaving}
          className={`${
            isProcessingImage || isSaving ? "bg-gray-400" : "bg-gray-900"
          } rounded-2xl py-4 items-center justify-center`}
          activeOpacity={0.8}
          style={{
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: isProcessingImage || isSaving ? 0 : 0.1,
            shadowRadius: 4,
            elevation: isProcessingImage || isSaving ? 0 : 4,
          }}
        >
          {isProcessingImage || isSaving ? (
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text className="text-base font-semibold text-white ml-3">
                {isProcessingImage
                  ? "Processing Image..."
                  : "Saving Vehicle..."}
              </Text>
            </View>
          ) : (
            <Text className="text-base font-bold text-white tracking-wide">
              {isNew ? "ADD VEHICLE" : "UPDATE VEHICLE"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default VehicleFormScreen;
