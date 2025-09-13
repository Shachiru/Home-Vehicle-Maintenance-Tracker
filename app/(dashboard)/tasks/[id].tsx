import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createTask, getTaskById, updateTask } from "@/services/taskService";
import { useLoader } from "@/context/LoaderContext";
import { useAuth } from "@/context/AuthContext";

const TaskFormScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isNew = !id || id === "new";
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const router = useRouter();
  const { hideLoader, showLoader } = useLoader();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    const load = async () => {
      if (!isNew && id && isAuthenticated) {
        try {
          showLoader();
          const task = await getTaskById(id);
          if (task) {
            setTitle(task.title);
            setDescription(task.description);
          }
        } catch (error) {
          console.error("Error loading task:", error);
          Alert.alert("Error", "Failed to load task");
        } finally {
          hideLoader();
        }
      }
    };

    if (!loading) {
      load();
    }
  }, [id, isAuthenticated, loading]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Validation", "Title is required");
      return;
    }

    if (!isAuthenticated) {
      Alert.alert("Error", "You must be logged in to save tasks");
      return;
    }

    try {
      showLoader();
      if (isNew) {
        await createTask({ title, description });
      } else {
        await updateTask(id!, { title, description });
      }
      router.back();
    } catch (err) {
      console.error("Error saving task:", err);
      Alert.alert("Error", "Failed to save task");
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
        <Text className="text-lg">Please log in to manage tasks</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 w-full p-5">
      <Text className="text-2xl font-bold">
        {isNew ? "Add Task" : "Edit Task"}
      </Text>
      <TextInput
        className="border border-gray-400 p-2 my-2 rounded-md"
        placeholder="title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        className="border border-gray-400 p-2 my-2 rounded-md"
        placeholder="description"
        value={description}
        onChangeText={setDescription}
      />
      <TouchableOpacity
        className="bg-blue-400 rounded-md px-6 py-3 my-2"
        onPress={handleSubmit}
      >
        <Text className="text-xl text-white text-center">
          {isNew ? "Add Task" : "Update Task"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default TaskFormScreen;
