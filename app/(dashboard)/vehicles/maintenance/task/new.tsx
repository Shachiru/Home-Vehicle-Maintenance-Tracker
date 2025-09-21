import { useLoader } from "@/context/LoaderContext";
import { useAuth } from "@/context/AuthContext";
import {
  createMaintenanceTask,
  getVehicleById,
} from "@/services/vehicleService";
import { MaintenanceCategory } from "@/types/maintenanceCategory";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

const NewMaintenanceTaskScreen = () => {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MaintenanceCategory>(
    MaintenanceCategory.OIL_CHANGE
  );
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [dueMileage, setDueMileage] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [vehicleName, setVehicleName] = useState("");

  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const loadVehicle = async () => {
      if (vehicleId) {
        try {
          showLoader();
          const vehicle = await getVehicleById(vehicleId);
          if (vehicle) {
            setVehicleName(`${vehicle.year} ${vehicle.make} ${vehicle.model}`);
          } else {
            setVehicleName("Unknown Vehicle");
          }
          hideLoader();
        } catch (error) {
          console.error("Error loading vehicle:", error);
          hideLoader();
          Alert.alert("Error", "Failed to load vehicle information");
        }
      }
    };

    if (isAuthenticated) {
      loadVehicle();
    }
  }, [vehicleId, isAuthenticated]);

  const handleSave = async () => {
    if (!title) {
      Alert.alert("Error", "Please enter a title for the maintenance task");
      return;
    }

    if (!dueMileage && !dueDate) {
      Alert.alert("Error", "Please specify either a due mileage or due date");
      return;
    }

    try {
      showLoader();

      const taskData = {
        title,
        description,
        category,
        difficulty,
        dueMileage: dueMileage ? parseInt(dueMileage) : undefined,
        dueDate: dueDate ? dueDate : undefined,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await createMaintenanceTask(vehicleId, taskData);
      hideLoader();

      router.back();
    } catch (error) {
      console.error("Error saving task:", error);
      hideLoader();
      Alert.alert("Error", "Failed to save maintenance task");
    }
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="bg-black px-6 pt-16 pb-8">
          <Text className="text-3xl font-bold text-white mb-2">
            New Maintenance Task
          </Text>
          <Text className="text-gray-400 text-base">{vehicleName}</Text>
        </View>

        {/* Form Section */}
        <View className="px-6 pt-8">
          {/* Title Input */}
          <View className="mb-6">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              TITLE *
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-black"
              placeholder="e.g., Oil Change, Brake Pad Replacement"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description Input */}
          <View className="mb-6">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              DESCRIPTION
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-black"
              placeholder="Add details about this maintenance task"
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Category and Difficulty Row */}
          <View className="flex-row mb-6">
            <View className="flex-1 mr-3">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                CATEGORY
              </Text>
              <View className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <Picker
                  selectedValue={category}
                  onValueChange={(value) =>
                    setCategory(value as MaintenanceCategory)
                  }
                  style={{ height: 56 }}
                >
                  {Object.values(MaintenanceCategory).map((cat) => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>
            </View>

            <View className="flex-1 ml-3">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                DIFFICULTY
              </Text>
              <View className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <Picker
                  selectedValue={difficulty}
                  onValueChange={(value) =>
                    setDifficulty(value as "easy" | "medium" | "hard")
                  }
                  style={{ height: 56 }}
                >
                  <Picker.Item label="Easy" value="easy" />
                  <Picker.Item label="Medium" value="medium" />
                  <Picker.Item label="Hard" value="hard" />
                </Picker>
              </View>
            </View>
          </View>

          {/* Due Information Section */}
          <View className="bg-gray-50 rounded-2xl p-6 mb-8">
            <Text className="text-sm font-semibold text-black mb-4">
              Schedule Information
            </Text>

            {/* Due Mileage */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                DUE MILEAGE
              </Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-base text-black"
                placeholder="e.g., 50000"
                placeholderTextColor="#9CA3AF"
                value={dueMileage}
                onChangeText={setDueMileage}
                keyboardType="numeric"
              />
            </View>

            {/* Due Date */}
            <View>
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                DUE DATE
              </Text>
              <TouchableOpacity
                className="bg-white border border-gray-200 rounded-xl px-4 py-4"
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text
                  className={
                    dueDate ? "text-black text-base" : "text-gray-400 text-base"
                  }
                >
                  {dueDate ? dueDate.toLocaleDateString() : "Select a date"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Actions */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100">
        <View className="flex-row px-6 py-4">
          <TouchableOpacity
            className="flex-1 border border-gray-300 py-4 rounded-xl mr-3"
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text className="text-center text-gray-700 font-semibold text-base">
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-black py-4 rounded-xl ml-3"
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text className="text-center text-white font-semibold text-base">
              Save Task
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </KeyboardAvoidingView>
  );
};

export default NewMaintenanceTaskScreen;
