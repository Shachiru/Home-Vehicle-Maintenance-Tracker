import { useLoader } from "@/context/LoaderContext";
import { getAllTaskData, taskColRef } from "@/services/taskService";
import { Task } from "@/types/task";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TaskScreen = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();

  const handleFetchData = async () => {
    showLoader();
    await getAllTaskData()
      .then((data) => {
        setTasks(data);
        console.log(data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        hideLoader();
      });
  };

  useEffect(() => {
    handleFetchData();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(taskColRef, (snapshot) => {
      const taskData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(taskData);
      hideLoader();
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = () => {
    Alert.alert("Alert Title", "Alert Desc", [
      { text: "Cancel" },
      { text: "Delete", onPress: async () => {} },
    ]);
  };

  return (
    <View className="flex-1 w-full bg-white relative">
      <Text className="text-3xl text-center text-blue-900 font-extrabold mb-6 mt-10 tracking-tight">
        Task Screen
      </Text>

      {/* Floating Action Button - Bottom Right */}
      <Pressable
        className="absolute bottom-10 right-6 bg-blue-600 rounded-full p-4 shadow-2xl z-40"
        onPress={() => router.push("/(dashboard)/tasks/new")}
        style={{
          elevation: 8,
        }}
      >
        <MaterialIcons name="add" size={30} color="#fff" />
      </Pressable>

      {/* ScrollView without animations */}
      <ScrollView
        className="flex-1 w-full px-5 pt-4 pb-28"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {tasks.length === 0 && (
          <View className="py-24 items-center justify-center">
            <Text className="text-gray-500 text-xl font-medium">
              No tasks found.
            </Text>
          </View>
        )}
        {tasks.map((task) => (
          <View
            key={task.id}
            className="mb-5 rounded-2xl bg-white shadow-lg p-6 border border-gray-200"
          >
            <Text className="text-xl font-semibold text-blue-900 mb-2 tracking-wide">
              {task.title}
            </Text>
            <Text className="text-gray-700 text-base mb-4 leading-relaxed">
              {task.description}
            </Text>
            <View className="flex-row space-x-4">
              <TouchableOpacity
                className="bg-blue-500 px-5 py-2.5 rounded-lg shadow-md"
                onPress={() => router.push(`/(dashboard)/tasks/${task.id}`)}
              >
                <Text className="text-white font-medium text-base">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-red-500 px-5 py-2.5 rounded-lg shadow-md"
                onPress={handleDelete}
              >
                <Text className="text-white font-medium text-base">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default TaskScreen;
