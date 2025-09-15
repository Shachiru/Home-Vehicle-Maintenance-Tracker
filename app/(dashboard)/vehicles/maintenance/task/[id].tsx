import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  createMaintenanceTask,
  getMaintenanceTaskById,
  updateMaintenanceTask,
  completeMaintenanceTask,
  getVehicleById,
} from "@/services/vehicleService";
import { useLoader } from "@/context/LoaderContext";
import { useAuth } from "@/context/AuthContext";
import { Vehicle } from "@/types/vehicle";
import { MaintenanceCategory } from "@/types/maintenanceCategory";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const MaintenanceTaskFormScreen = () => {
  const { id, vehicleId, complete } = useLocalSearchParams<{
    id?: string;
    vehicleId: string;
    complete?: string;
  }>();
  const isNew = !id || id === "new";
  const isCompleting = complete === "true";

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<MaintenanceCategory>(
    MaintenanceCategory.OIL_CHANGE
  );
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [dueMileage, setDueMileage] = useState<string>("");
  const [hasDueDate, setHasDueDate] = useState<boolean>(false);
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [completedMileage, setCompletedMileage] = useState<string>("");
  const [cost, setCost] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [partsList, setPartsList] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const router = useRouter();
  const { hideLoader, showLoader } = useLoader();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    const loadVehicle = async () => {
      if (vehicleId) {
        try {
          const vehicleData = await getVehicleById(vehicleId);
          setVehicle(vehicleData);
          // Set default mileage values based on vehicle
          if (isNew && vehicleData) {
            setDueMileage((vehicleData.mileage + 5000).toString()); // Default to current mileage + 5000
            setCompletedMileage(vehicleData.mileage.toString());
          }
        } catch (error) {
          console.error("Error loading vehicle:", error);
        }
      }
    };

    loadVehicle();
  }, [vehicleId, isNew]);

  useEffect(() => {
    const load = async () => {
      if (!isNew && id && vehicleId && isAuthenticated) {
        try {
          showLoader();
          const task = await getMaintenanceTaskById(vehicleId, id);
          if (task) {
            setTitle(task.title);
            setDescription(task.description);
            setCategory(task.category);
            setDifficulty(task.difficulty || "medium");
            setDueMileage(task.dueMileage?.toString() || "");
            if (task.dueDate) {
              setHasDueDate(true);
              setDueDate(new Date(task.dueDate));
            }
            setIsCompleted(task.completed);
            setCompletedMileage(task.completedMileage?.toString() || "");
            setCost(task.cost?.toString() || "");
            setNotes(task.notes || "");
            setPartsList(task.partsList?.join("\n") || "");
          }
        } catch (error) {
          console.error("Error loading task:", error);
          Alert.alert("Error", "Failed to load maintenance task");
        } finally {
          hideLoader();
        }
      }
    };

    if (!loading) {
      load();
    }
  }, [id, vehicleId, isAuthenticated, loading]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const validateForm = () => {
    if (!title.trim()) return "Title is required";
    if (!category) return "Category is required";

    if (!isCompleted) {
      // For new or uncompleted tasks
      if (!dueMileage && !hasDueDate) {
        return "Either due mileage or due date is required";
      }

      if (dueMileage && isNaN(Number(dueMileage))) {
        return "Due mileage must be a number";
      }
    } else {
      // For completed tasks
      if (!completedMileage) {
        return "Completed mileage is required";
      }

      if (isNaN(Number(completedMileage))) {
        return "Completed mileage must be a number";
      }

      if (cost && isNaN(Number(cost))) {
        return "Cost must be a number";
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert("Validation Error", validationError);
      return;
    }

    if (!isAuthenticated) {
      Alert.alert("Error", "You must be logged in to save maintenance tasks");
      return;
    }

    try {
      showLoader();

      // Parse the parts list from text area to array
      const partsArray = partsList
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item !== "");

      const taskData = {
        title,
        description,
        category,
        difficulty,
        dueMileage: dueMileage ? parseInt(dueMileage) : undefined,
        dueDate: hasDueDate ? dueDate : undefined,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : undefined,
        completedMileage:
          isCompleted && completedMileage
            ? parseInt(completedMileage)
            : undefined,
        cost: cost ? parseFloat(cost) : undefined,
        notes,
        partsList: partsArray.length > 0 ? partsArray : undefined,
      };

      if (isNew) {
        await createMaintenanceTask(vehicleId, taskData);
      } else if (isCompleting) {
        await completeMaintenanceTask(vehicleId, id!, {
          completedMileage: parseInt(completedMileage),
          cost: cost ? parseFloat(cost) : undefined,
          notes,
        });
      } else {
        await updateMaintenanceTask(vehicleId, id!, taskData);
      }

      router.replace(`../[vehicleId]?vehicleId=${vehicleId}`);
    } catch (err) {
      console.error("Error saving maintenance task:", err);
      Alert.alert("Error", "Failed to save maintenance task");
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
        <Text className="text-lg">
          Please log in to manage maintenance tasks
        </Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg">Vehicle not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 w-full p-5">
      <View className="flex-row items-center mb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold flex-1">
          {isNew
            ? "Add Maintenance Task"
            : isCompleting
            ? "Complete Maintenance Task"
            : "Edit Maintenance Task"}
        </Text>
      </View>

      <Text className="text-sm text-gray-500 mb-4">
        Vehicle: {vehicle.year} {vehicle.make} {vehicle.model}
      </Text>

      {!isCompleting && (
        <>
          <Text className="text-gray-700 mb-1">Title*</Text>
          <TextInput
            className="border border-gray-400 p-2 mb-3 rounded-md"
            placeholder="e.g. Oil Change"
            value={title}
            onChangeText={setTitle}
          />

          <Text className="text-gray-700 mb-1">Description</Text>
          <TextInput
            className="border border-gray-400 p-2 mb-3 rounded-md"
            placeholder="Details about this maintenance task"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text className="text-gray-700 mb-1">Category</Text>
          <View className="border border-gray-400 rounded-md mb-3">
            <Picker
              selectedValue={category}
              onValueChange={(itemValue) =>
                setCategory(itemValue as MaintenanceCategory)
              }
            >
              {Object.values(MaintenanceCategory).map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>

          <Text className="text-gray-700 mb-1">Difficulty</Text>
          <View className="border border-gray-400 rounded-md mb-3">
            <Picker
              selectedValue={difficulty}
              onValueChange={(itemValue) =>
                setDifficulty(itemValue as "easy" | "medium" | "hard")
              }
            >
              <Picker.Item label="Easy" value="easy" />
              <Picker.Item label="Medium" value="medium" />
              <Picker.Item label="Hard" value="hard" />
            </Picker>
          </View>
        </>
      )}

      {!isCompleted && !isCompleting && (
        <>
          <Text className="text-gray-700 mb-1">Due at Mileage</Text>
          <TextInput
            className="border border-gray-400 p-2 mb-3 rounded-md"
            placeholder={`e.g. ${vehicle.mileage + 5000}`}
            value={dueMileage}
            onChangeText={setDueMileage}
            keyboardType="numeric"
          />

          <View className="flex-row items-center mb-2">
            <Switch
              value={hasDueDate}
              onValueChange={setHasDueDate}
              trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
              thumbColor={hasDueDate ? "#3b82f6" : "#f4f4f5"}
            />
            <Text className="ml-2 text-gray-700">Set Due Date</Text>
          </View>

          {hasDueDate && (
            <View className="mb-3">
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="border border-gray-400 p-3 rounded-md"
              >
                <Text>{formatDate(dueDate)}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={dueDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>
          )}
        </>
      )}

      {(isCompleted || isCompleting) && (
        <>
          <Text className="text-gray-700 mb-1">Completed at Mileage*</Text>
          <TextInput
            className="border border-gray-400 p-2 mb-3 rounded-md"
            placeholder={`Current mileage: ${vehicle.mileage}`}
            value={completedMileage}
            onChangeText={setCompletedMileage}
            keyboardType="numeric"
          />

          <Text className="text-gray-700 mb-1">Cost ($)</Text>
          <TextInput
            className="border border-gray-400 p-2 mb-3 rounded-md"
            placeholder="e.g. 49.99"
            value={cost}
            onChangeText={setCost}
            keyboardType="numeric"
          />

          <Text className="text-gray-700 mb-1">Notes</Text>
          <TextInput
            className="border border-gray-400 p-2 mb-3 rounded-md"
            placeholder="Additional notes about completion"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {!isCompleting && (
            <>
              <Text className="text-gray-700 mb-1">
                Parts Used (one per line)
              </Text>
              <TextInput
                className="border border-gray-400 p-2 mb-3 rounded-md"
                placeholder="List parts used (one per line)"
                value={partsList}
                onChangeText={setPartsList}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </>
          )}
        </>
      )}

      <TouchableOpacity
        className="bg-blue-500 rounded-md px-6 py-3 my-4"
        onPress={handleSubmit}
      >
        <Text className="text-xl text-white text-center">
          {isNew
            ? "Add Task"
            : isCompleting
            ? "Mark as Completed"
            : "Update Task"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default MaintenanceTaskFormScreen;
