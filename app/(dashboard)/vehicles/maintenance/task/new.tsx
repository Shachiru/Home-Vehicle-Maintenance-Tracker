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

      // Navigate back to maintenance screen
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
    <ScrollView className="flex-1 bg-white p-5">
      <Text className="text-xl font-bold mb-1">New Maintenance Task</Text>
      <Text className="text-gray-600 mb-5">for {vehicleName}</Text>

      <Text className="font-medium mb-1">Title</Text>
      <TextInput
        className="bg-gray-100 rounded-lg p-3 mb-4"
        placeholder="e.g., Oil Change, Brake Pad Replacement"
        value={title}
        onChangeText={setTitle}
      />

      <Text className="font-medium mb-1">Description</Text>
      <TextInput
        className="bg-gray-100 rounded-lg p-3 mb-4"
        placeholder="Add details about this maintenance task"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Text className="font-medium mb-1">Category</Text>
      <View className="bg-gray-100 rounded-lg mb-4">
        <Picker
          selectedValue={category}
          onValueChange={(value) => setCategory(value as MaintenanceCategory)}
        >
          {Object.values(MaintenanceCategory).map((cat) => (
            <Picker.Item key={cat} label={cat} value={cat} />
          ))}
        </Picker>
      </View>

      <Text className="font-medium mb-1">Difficulty</Text>
      <View className="bg-gray-100 rounded-lg mb-4">
        <Picker
          selectedValue={difficulty}
          onValueChange={(value) =>
            setDifficulty(value as "easy" | "medium" | "hard")
          }
        >
          <Picker.Item label="Easy" value="easy" />
          <Picker.Item label="Medium" value="medium" />
          <Picker.Item label="Hard" value="hard" />
        </Picker>
      </View>

      <Text className="font-medium mb-1">Due Mileage</Text>
      <TextInput
        className="bg-gray-100 rounded-lg p-3 mb-4"
        placeholder="e.g., 50000"
        value={dueMileage}
        onChangeText={setDueMileage}
        keyboardType="numeric"
      />

      <Text className="font-medium mb-1">Due Date</Text>
      <TouchableOpacity
        className="bg-gray-100 rounded-lg p-3 mb-4"
        onPress={() => setShowDatePicker(true)}
      >
        <Text>{dueDate ? dueDate.toLocaleDateString() : "Select a date"}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <View className="flex-row mt-6 mb-10">
        <TouchableOpacity
          className="flex-1 bg-gray-300 py-3 rounded-lg mr-2"
          onPress={() => router.back()}
        >
          <Text className="text-center font-medium">Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-2 bg-blue-600 py-3 rounded-lg flex-grow"
          onPress={handleSave}
        >
          <Text className="text-center text-white font-medium">Save Task</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default NewMaintenanceTaskScreen;
