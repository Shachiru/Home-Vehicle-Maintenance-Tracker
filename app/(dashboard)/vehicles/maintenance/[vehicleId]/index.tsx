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
      return "border-gray-200";
    }

    // Check if task is overdue
    if (task.dueDate && new Date(task.dueDate) < new Date()) {
      return "border-black";
    }

    if (task.dueMileage && vehicle && task.dueMileage <= vehicle.mileage) {
      return "border-black";
    }

    return "border-gray-300";
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

  const getStatusDotColor = (task: MaintenanceTask) => {
    if (task.completed) return "bg-gray-400";

    const isOverdueMileage =
      task.dueMileage && vehicle && task.dueMileage <= vehicle.mileage;
    const isOverdueDate = task.dueDate && new Date(task.dueDate) < new Date();

    if (isOverdueMileage || isOverdueDate) return "bg-black";

    return "bg-gray-600";
  };

  const filteredTasks = showCompleted
    ? tasks
    : tasks.filter((task) => !task.completed);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg text-gray-600">Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg text-gray-600">
          Please log in to view maintenance tasks
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 w-full bg-gray-50 relative">
      {/* Header */}
      <View className="pt-12 pb-6 px-6 bg-black">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <View className="flex-row items-center">
            <MaterialIcons name="arrow-back-ios" size={20} color="#fff" />
            <Text className="text-white ml-1 text-sm">Back</Text>
          </View>
        </TouchableOpacity>

        <Text className="text-3xl text-white font-bold">
          {vehicle
            ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
            : "Maintenance"}
        </Text>

        {vehicle && (
          <View className="flex-row items-center mt-2">
            <View className="w-2 h-2 bg-white rounded-full mr-2 opacity-60" />
            <Text className="text-white opacity-80 text-sm">
              {vehicle.mileage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" "}
              miles
            </Text>
          </View>
        )}
      </View>

      {/* Filter Bar */}
      <View className="flex-row justify-between items-center px-6 py-4 bg-white border-b border-gray-100">
        <Text className="text-base font-semibold text-black">
          {filteredTasks.length} {filteredTasks.length === 1 ? "Task" : "Tasks"}
        </Text>
        <View className="flex-row items-center">
          <Text className="mr-3 text-gray-600 text-sm">Completed</Text>
          <Switch
            value={showCompleted}
            onValueChange={setShowCompleted}
            trackColor={{ false: "#e5e5e5", true: "#000000" }}
            thumbColor="#ffffff"
            ios_backgroundColor="#e5e5e5"
          />
        </View>
      </View>

      {/* FAB */}
      <Pressable
        className="absolute bottom-8 right-6 bg-black rounded-full p-4 shadow-2xl z-40"
        onPress={() =>
          router.push(`/vehicles/maintenance/task/new?vehicleId=${vehicleId}`)
        }
        style={{
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </Pressable>

      {/* Task List */}
      <ScrollView
        className="flex-1 w-full"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredTasks.length === 0 && (
          <View className="py-32 items-center justify-center px-8">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <MaterialIcons name="build" size={32} color="#9ca3af" />
            </View>
            <Text className="text-gray-900 text-xl font-semibold text-center">
              No maintenance tasks
            </Text>
            <Text className="text-gray-500 mt-2 text-center text-sm">
              Keep your vehicle in top shape by scheduling regular maintenance
            </Text>
          </View>
        )}

        <View className="px-6 pt-4">
          {filteredTasks.map((task, index) => (
            <View
              key={task.id}
              className={`mb-4 bg-white rounded-2xl shadow-sm border ${getTaskStatusStyle(
                task
              )}`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
              }}
            >
              {/* Card Header */}
              <View className="p-5 pb-0">
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1 mr-3">
                    <Text className="text-lg font-semibold text-black mb-1">
                      {task.title}
                    </Text>
                    <Text className="text-gray-600 text-sm leading-5">
                      {task.description}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <View
                      className={`w-2 h-2 rounded-full mr-2 ${getStatusDotColor(
                        task
                      )}`}
                    />
                    <Text
                      className={`text-xs font-medium ${
                        task.completed
                          ? "text-gray-500"
                          : getTaskStatusText(task) === "Overdue"
                          ? "text-black"
                          : "text-gray-700"
                      }`}
                    >
                      {getTaskStatusText(task)}
                    </Text>
                  </View>
                </View>

                {/* Tags */}
                <View className="flex-row flex-wrap -mx-1 mb-3">
                  {task.category && (
                    <View className="mx-1 mb-2">
                      <View className="bg-gray-100 rounded-full px-3 py-1.5">
                        <Text className="text-xs text-gray-700 font-medium">
                          {task.category}
                        </Text>
                      </View>
                    </View>
                  )}

                  {task.difficulty && (
                    <View className="mx-1 mb-2">
                      <View
                        className={`rounded-full px-3 py-1.5 ${
                          task.difficulty === "easy"
                            ? "bg-gray-100"
                            : task.difficulty === "medium"
                            ? "bg-gray-200"
                            : "bg-gray-300"
                        }`}
                      >
                        <Text className="text-xs text-gray-700 font-medium">
                          {task.difficulty.charAt(0).toUpperCase() +
                            task.difficulty.slice(1)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {(task.dueMileage || task.dueDate) && (
                    <View className="mx-1 mb-2">
                      <View className="bg-black rounded-full px-3 py-1.5 flex-row items-center">
                        <MaterialIcons name="schedule" size={10} color="#fff" />
                        <Text className="text-xs text-white font-medium ml-1">
                          {task.dueMileage
                            ? `${task.dueMileage
                                .toString()
                                .replace(/\B(?=(\d{3})+(?!\d))/g, ",")} mi`
                            : new Date(task.dueDate!).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Card Actions */}
              <View className="border-t border-gray-100 p-5 pt-4">
                <View className="flex-row">
                  <TouchableOpacity
                    className="flex-1 bg-black py-3 rounded-xl"
                    onPress={() =>
                      router.push(
                        `/vehicles/maintenance/task/${task.id}?vehicleId=${vehicleId}`
                      )
                    }
                  >
                    <Text className="text-white font-medium text-center text-sm">
                      View Details
                    </Text>
                  </TouchableOpacity>

                  {!task.completed && (
                    <>
                      <View className="w-2" />
                      <TouchableOpacity
                        className="flex-1 bg-gray-100 py-3 rounded-xl"
                        onPress={() =>
                          router.push(
                            `/vehicles/maintenance/task/${task.id}?vehicleId=${vehicleId}&complete=true`
                          )
                        }
                      >
                        <Text className="text-black font-medium text-center text-sm">
                          Mark Complete
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <View className="w-2" />
                  <TouchableOpacity
                    className="bg-gray-100 px-4 py-3 rounded-xl"
                    onPress={() => task.id && handleDelete(task.id)}
                  >
                    <MaterialIcons
                      name="delete-outline"
                      size={18}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default MaintenanceScreen;
