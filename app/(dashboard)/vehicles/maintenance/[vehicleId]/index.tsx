import { useLoader } from "@/context/LoaderContext";
import { useAuth } from "@/context/AuthContext";
import {
  getMaintenanceTasks,
  getVehicleMaintenanceColRef,
  deleteMaintenanceTask,
  getVehicleById,
} from "@/services/vehicleService";
import { MaintenanceTask } from "@/types/maintenanceTask";
import { Vehicle } from "@/types/vehicle";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Switch,
} from "react-native";

const MaintenanceScreen = () => {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    const loadVehicle = async () => {
      if (vehicleId) {
        try {
          const vehicleData = await getVehicleById(vehicleId);
          setVehicle(vehicleData);
        } catch (error) {
          console.error("Error loading vehicle:", error);
        }
      }
    };

    loadVehicle();
  }, [vehicleId]);

  useEffect(() => {
    if (!loading && isAuthenticated && user && vehicleId) {
      let unsubscribe: (() => void) | undefined;

      const setupListener = async () => {
        try {
          showLoader();
          const tasksColRef = await getVehicleMaintenanceColRef(vehicleId);

          unsubscribe = onSnapshot(
            tasksColRef,
            (snapshot) => {
              const taskData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })) as MaintenanceTask[];

              console.log("Maintenance tasks loaded:", taskData.length);
              setTasks(taskData);
              hideLoader();
            },
            (error) => {
              console.error("Firestore error:", error);
              hideLoader();
              Alert.alert("Error", "Failed to load maintenance tasks");
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
  }, [user, loading, isAuthenticated, vehicleId]);

  const handleDelete = (taskId: string) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this maintenance task?",
      [
        { text: "Cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              showLoader();
              await deleteMaintenanceTask(vehicleId, taskId);
            } catch (error) {
              console.error("Error deleting task:", error);
              Alert.alert("Error", "Failed to delete maintenance task");
            } finally {
              hideLoader();
            }
          },
        },
      ]
    );
  };

  const getTaskStatusStyle = (task: MaintenanceTask) => {
    if (task.completed) {
      return "bg-green-100 border-green-300";
    }

    // Check if task is overdue
    if (task.dueDate && new Date(task.dueDate) < new Date()) {
      return "bg-red-100 border-red-300";
    }

    if (task.dueMileage && vehicle && task.dueMileage <= vehicle.mileage) {
      return "bg-red-100 border-red-300";
    }

    return "bg-yellow-50 border-yellow-200";
  };

  const getTaskStatusText = (task: MaintenanceTask) => {
    if (task.completed) {
      return "Completed";
    }

    // Check if task is overdue
    const isOverdueMileage =
      task.dueMileage && vehicle && task.dueMileage <= vehicle.mileage;
    const isOverdueDate = task.dueDate && new Date(task.dueDate) < new Date();

    if (isOverdueMileage || isOverdueDate) {
      return "Overdue";
    }

    return "Scheduled";
  };

  const filteredTasks = showCompleted
    ? tasks
    : tasks.filter((task) => !task.completed);

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
        <Text className="text-lg">Please log in to view maintenance tasks</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 w-full bg-white relative">
      <View className="pt-12 pb-4 px-5 bg-blue-900">
        <TouchableOpacity onPress={() => router.back()} className="mb-2">
          <View className="flex-row items-center">
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
            <Text className="text-white ml-1">Back to Vehicles</Text>
          </View>
        </TouchableOpacity>

        <Text className="text-2xl text-white font-bold">
          {vehicle
            ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
            : "Vehicle Maintenance"}
        </Text>

        {vehicle && (
          <Text className="text-blue-200 mt-1">
            Current Mileage:{" "}
            {vehicle.mileage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" "}
            miles
          </Text>
        )}
      </View>

      <View className="flex-row justify-between items-center px-5 py-3 bg-gray-100">
        <Text className="text-lg font-semibold">Maintenance Tasks</Text>
        <View className="flex-row items-center">
          <Text className="mr-2 text-gray-600">Show Completed</Text>
          <Switch
            value={showCompleted}
            onValueChange={setShowCompleted}
            trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
            thumbColor={showCompleted ? "#3b82f6" : "#f4f4f5"}
          />
        </View>
      </View>

      <Pressable
        className="absolute bottom-10 right-6 bg-blue-600 rounded-full p-4 shadow-2xl z-40"
        onPress={() => router.push(`../task/new?vehicleId=${vehicleId}`)}
        style={{ elevation: 8 }}
      >
        <MaterialIcons name="add" size={30} color="#fff" />
      </Pressable>

      <ScrollView
        className="flex-1 w-full px-5 pt-4 pb-28"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {filteredTasks.length === 0 && (
          <View className="py-24 items-center justify-center">
            <Text className="text-gray-500 text-xl font-medium">
              No maintenance tasks found.
            </Text>
            <Text className="text-gray-400 mt-2 text-center">
              Add your first maintenance task to keep track of your vehicle's
              health.
            </Text>
          </View>
        )}

        {filteredTasks.map((task) => (
          <View
            key={task.id}
            className={`mb-5 rounded-xl bg-white shadow-md p-5 border ${getTaskStatusStyle(
              task
            )}`}
          >
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-xl font-semibold text-gray-800 flex-1 mr-2">
                {task.title}
              </Text>
              <View
                className={`px-2 py-1 rounded-full ${
                  task.completed
                    ? "bg-green-500"
                    : task.dueDate && new Date(task.dueDate) < new Date()
                    ? "bg-red-500"
                    : "bg-yellow-500"
                }`}
              >
                <Text className="text-xs text-white font-medium">
                  {getTaskStatusText(task)}
                </Text>
              </View>
            </View>

            <Text className="text-gray-700 mb-3">{task.description}</Text>

            <View className="flex-row flex-wrap mb-3">
              {task.category && (
                <View className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-1">
                  <Text className="text-xs text-blue-800">{task.category}</Text>
                </View>
              )}

              {task.difficulty && (
                <View
                  className={`rounded-full px-3 py-1 mr-2 mb-1 ${
                    task.difficulty === "easy"
                      ? "bg-green-100"
                      : task.difficulty === "medium"
                      ? "bg-yellow-100"
                      : "bg-red-100"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      task.difficulty === "easy"
                        ? "text-green-800"
                        : task.difficulty === "medium"
                        ? "text-yellow-800"
                        : "text-red-800"
                    }`}
                  >
                    {task.difficulty.charAt(0).toUpperCase() +
                      task.difficulty.slice(1)}
                  </Text>
                </View>
              )}

              {task.dueMileage && (
                <View className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-1">
                  <Text className="text-xs text-gray-800">
                    Due:{" "}
                    {task.dueMileage
                      .toString()
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" "}
                    miles
                  </Text>
                </View>
              )}

              {task.dueDate && (
                <View className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-1">
                  <Text className="text-xs text-gray-800">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row space-x-3 mt-2">
              <TouchableOpacity
                className="flex-1 bg-blue-500 px-3 py-2 rounded-lg shadow-sm"
                onPress={() =>
                  router.push(`../task/${task.id}?vehicleId=${vehicleId}`)
                }
              >
                <Text className="text-white font-medium text-center">
                  {task.completed ? "View Details" : "Update"}
                </Text>
              </TouchableOpacity>

              {!task.completed && (
                <TouchableOpacity
                  className="flex-1 bg-green-500 px-3 py-2 rounded-lg shadow-sm"
                  onPress={() =>
                    router.push(
                      `../task/${task.id}?vehicleId=${vehicleId}&complete=true`
                    )
                  }
                >
                  <Text className="text-white font-medium text-center">
                    Complete
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                className="bg-red-500 px-3 py-2 rounded-lg shadow-sm"
                onPress={() => task.id && handleDelete(task.id)}
              >
                <Text className="text-white font-medium text-center">
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default MaintenanceScreen;
