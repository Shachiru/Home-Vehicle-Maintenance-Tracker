import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  Animated,
  Dimensions,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
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

const { width: screenWidth } = Dimensions.get("window");

const MaintenanceTaskFormScreen = () => {
  const { id, vehicleId, complete } = useLocalSearchParams<{
    id?: string;
    vehicleId: string;
    complete?: string;
  }>();
  const isNew = !id || id === "new";
  const isCompleting = complete === "true";

  // Form state
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

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const formFadeAnims = useRef(
    [...Array(8)].map(() => new Animated.Value(0))
  ).current;

  const router = useRouter();
  const { hideLoader, showLoader } = useLoader();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Initial animations - subtle and professional
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered form field animations
    const staggeredAnimations = formFadeAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      })
    );

    setTimeout(() => {
      Animated.stagger(50, staggeredAnimations).start();
    }, 200);
  }, []);

  useEffect(() => {
    const loadVehicle = async () => {
      if (vehicleId) {
        try {
          const vehicleData = await getVehicleById(vehicleId);
          setVehicle(vehicleData);
          if (isNew && vehicleData) {
            setDueMileage((vehicleData.mileage + 5000).toString());
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
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const validateForm = () => {
    if (!title.trim()) return "Title is required";
    if (!category) return "Category is required";

    if (!isCompleted) {
      if (!dueMileage && !hasDueDate) {
        return "Either due mileage or due date is required";
      }
      if (dueMileage && isNaN(Number(dueMileage))) {
        return "Due mileage must be a number";
      }
    } else {
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

  const getDifficultyIcon = (level: string) => {
    switch (level) {
      case "easy":
        return "sentiment-very-satisfied";
      case "medium":
        return "sentiment-neutral";
      case "hard":
        return "sentiment-very-dissatisfied";
      default:
        return "sentiment-neutral";
    }
  };

  const getCategoryIcon = (
    category: MaintenanceCategory
  ): React.ComponentProps<typeof MaterialIcons>["name"] => {
    const iconMap: Record<
      MaintenanceCategory,
      React.ComponentProps<typeof MaterialIcons>["name"]
    > = {
      [MaintenanceCategory.OIL_CHANGE]: "local-gas-station",
      [MaintenanceCategory.TIRE_ROTATION]: "refresh",
      [MaintenanceCategory.BRAKE_SERVICE]: "speed",
      [MaintenanceCategory.FILTER_REPLACEMENT]: "filter-list",
      [MaintenanceCategory.FLUID_CHECK]: "opacity",
      [MaintenanceCategory.BATTERY_SERVICE]: "battery-full",
      [MaintenanceCategory.ENGINE_SERVICE]: "settings",
      [MaintenanceCategory.TRANSMISSION]: "cached",
      [MaintenanceCategory.INSPECTION]: "search",
      [MaintenanceCategory.OTHER]: "build",
    };
    return iconMap[category] || "build";
  };

  type FormFieldProps = {
    children: React.ReactNode;
    animationIndex?: number;
  };

  const FormField: React.FC<FormFieldProps> = ({
    children,
    animationIndex = 0,
  }) => (
    <Animated.View
      style={{
        opacity: formFadeAnims[animationIndex],
        transform: [
          {
            translateY: formFadeAnims[animationIndex].interpolate({
              inputRange: [0, 1],
              outputRange: [15, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );

  type InputWithIconProps = {
    icon: React.ComponentProps<typeof MaterialIcons>["name"];
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
    multiline?: boolean;
    numberOfLines?: number;
    required?: boolean;
  };

  const InputWithIcon: React.FC<InputWithIconProps> = ({
    icon,
    placeholder,
    value,
    onChangeText,
    keyboardType = "default",
    multiline = false,
    numberOfLines = 1,
    required = false,
  }) => (
    <View className="mb-4">
      <View
        className={`
        bg-white border border-black/5 rounded-xl px-4 py-4.5 flex-row
        ${multiline ? "items-start" : "items-center"}
      `}
        style={{
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.02,
          shadowRadius: 8,
          elevation: 1,
        }}
      >
        <View className={`mr-3 ${multiline ? "mt-0.5" : ""}`}>
          <MaterialIcons name={icon} size={20} color="rgba(0, 0, 0, 0.4)" />
        </View>
        <TextInput
          className={`
            flex-1 text-black text-base font-normal leading-5.5
            ${multiline ? "text-top" : "text-center"}
          `}
          style={{
            minHeight: multiline ? numberOfLines * 22 : 22,
            textAlignVertical: multiline ? "top" : "center",
          }}
          placeholder={placeholder}
          placeholderTextColor="rgba(0, 0, 0, 0.35)"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
        {required && (
          <View className="ml-2">
            <Text className="text-black text-base font-medium">*</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <View className="bg-black/2 p-8 rounded-2xl items-center">
          <MaterialIcons
            name="hourglass-empty"
            size={32}
            color="rgba(0, 0, 0, 0.4)"
          />
          <Text className="text-lg text-black mt-4 font-medium">
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-white">
        <View className="bg-black/2 p-8 rounded-2xl items-center max-w-80">
          <MaterialIcons name="lock" size={48} color="rgba(0, 0, 0, 0.4)" />
          <Text className="text-lg text-black mt-4 text-center font-medium leading-6">
            Please log in to manage maintenance tasks
          </Text>
        </View>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-white">
        <View className="bg-black/2 p-8 rounded-2xl items-center">
          <MaterialIcons
            name="error-outline"
            size={48}
            color="rgba(0, 0, 0, 0.4)"
          />
          <Text className="text-lg text-black mt-4 font-medium">
            Vehicle not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
        className="bg-white border-b border-black/5"
      >
        <View className="flex-row items-center justify-between px-5 py-4 pt-14">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-11 h-11 rounded-xl items-center justify-center mr-4 bg-black/5"
            >
              <MaterialIcons name="arrow-back" size={20} color="#000000" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-xl font-semibold text-black mb-0.5">
                {isNew
                  ? "New Task"
                  : isCompleting
                  ? "Complete Task"
                  : "Edit Task"}
              </Text>
              <Text className="text-sm text-black/50 font-normal">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
            </View>
          </View>
          <View className="w-11 h-11 rounded-xl bg-black items-center justify-center">
            <MaterialIcons
              name={isNew ? "add" : isCompleting ? "check" : "edit"}
              size={20}
              color="white"
            />
          </View>
        </View>
      </Animated.View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {!isCompleting && (
          <>
            <FormField animationIndex={0}>
              <View className="mb-6">
                <Text className="text-xs font-bold text-black/60 mb-4 uppercase tracking-widest">
                  Task Information
                </Text>
                <InputWithIcon
                  icon="title"
                  placeholder="Enter task title"
                  value={title}
                  onChangeText={setTitle}
                  required
                />
                <InputWithIcon
                  icon="description"
                  placeholder="Task description (optional)"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </FormField>

            <FormField animationIndex={1}>
              <View className="mb-6">
                <Text className="text-xs font-bold text-black/60 mb-4 uppercase tracking-widest">
                  Category & Difficulty
                </Text>

                <View
                  className="bg-white border border-black/5 rounded-xl mb-4"
                  style={{
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.02,
                    shadowRadius: 8,
                    elevation: 1,
                  }}
                >
                  <View className="flex-row items-center px-4 py-1">
                    <MaterialIcons
                      name={getCategoryIcon(category) as any}
                      size={20}
                      color="rgba(0, 0, 0, 0.4)"
                    />
                    <Picker
                      selectedValue={category}
                      onValueChange={(itemValue) =>
                        setCategory(itemValue as MaintenanceCategory)
                      }
                      style={{
                        flex: 1,
                        marginLeft: 12,
                        color: "#000000",
                        fontSize: 16,
                      }}
                    >
                      {Object.values(MaintenanceCategory).map((cat) => (
                        <Picker.Item
                          key={cat}
                          label={cat
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                          value={cat}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View
                  className="bg-white border border-black/5 rounded-xl"
                  style={{
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.02,
                    shadowRadius: 8,
                    elevation: 1,
                  }}
                >
                  <View className="flex-row items-center px-4 py-1">
                    <MaterialIcons
                      name={getDifficultyIcon(difficulty)}
                      size={20}
                      color="rgba(0, 0, 0, 0.4)"
                    />
                    <Picker
                      selectedValue={difficulty}
                      onValueChange={(itemValue) =>
                        setDifficulty(itemValue as "easy" | "medium" | "hard")
                      }
                      style={{
                        flex: 1,
                        marginLeft: 12,
                        color: "#000000",
                        fontSize: 16,
                      }}
                    >
                      <Picker.Item label="Easy" value="easy" />
                      <Picker.Item label="Medium" value="medium" />
                      <Picker.Item label="Hard" value="hard" />
                    </Picker>
                  </View>
                </View>
              </View>
            </FormField>
          </>
        )}

        {!isCompleted && !isCompleting && (
          <FormField animationIndex={2}>
            <View className="mb-6">
              <Text className="text-xs font-bold text-black/60 mb-4 uppercase tracking-widest">
                Schedule
              </Text>
              <InputWithIcon
                icon="speed"
                placeholder={`Due at mileage (Current: ${vehicle.mileage.toLocaleString()})`}
                value={dueMileage}
                onChangeText={setDueMileage}
                keyboardType="numeric"
              />

              <View
                className="flex-row items-center bg-white px-4 py-4.5 rounded-xl border border-black/5"
                style={{
                  shadowColor: "#000000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.02,
                  shadowRadius: 8,
                  elevation: 1,
                }}
              >
                <MaterialIcons
                  name="calendar-today"
                  size={20}
                  color="rgba(0, 0, 0, 0.4)"
                />
                <Text className="ml-3 flex-1 text-black font-normal text-base">
                  Set Due Date
                </Text>
                <Switch
                  value={hasDueDate}
                  onValueChange={setHasDueDate}
                  trackColor={{
                    false: "rgba(0, 0, 0, 0.1)",
                    true: "#000000",
                  }}
                  thumbColor="white"
                  ios_backgroundColor="rgba(0, 0, 0, 0.1)"
                />
              </View>

              {hasDueDate && (
                <View className="mt-4">
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="bg-white border border-black/5 rounded-xl"
                    style={{
                      shadowColor: "#000000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.02,
                      shadowRadius: 8,
                      elevation: 1,
                    }}
                  >
                    <View className="flex-row items-center px-4 py-4.5">
                      <MaterialIcons
                        name="event"
                        size={20}
                        color="rgba(0, 0, 0, 0.4)"
                      />
                      <Text className="ml-3 text-black text-base font-medium">
                        {formatDate(dueDate)}
                      </Text>
                    </View>
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
            </View>
          </FormField>
        )}

        {(isCompleted || isCompleting) && (
          <FormField animationIndex={3}>
            <View className="mb-6">
              <Text className="text-xs font-bold text-black/60 mb-4 uppercase tracking-widest">
                Completion Details
              </Text>
              <InputWithIcon
                icon="speed"
                placeholder="Completed at mileage"
                value={completedMileage}
                onChangeText={setCompletedMileage}
                keyboardType="numeric"
                required
              />
              <InputWithIcon
                icon="attach-money"
                placeholder="Total cost (optional)"
                value={cost}
                onChangeText={setCost}
                keyboardType="numeric"
              />
              <InputWithIcon
                icon="note"
                placeholder="Completion notes (optional)"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
              {!isCompleting && (
                <InputWithIcon
                  icon="build"
                  placeholder="Parts used (one per line)"
                  value={partsList}
                  onChangeText={setPartsList}
                  multiline
                  numberOfLines={4}
                />
              )}
            </View>
          </FormField>
        )}

        {/* Submit Button */}
        <FormField animationIndex={4}>
          <View className="mt-2">
            <TouchableOpacity
              className="bg-black rounded-2xl py-5 px-6 flex-row items-center justify-center"
              onPress={handleSubmit}
              style={{
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <MaterialIcons
                name={isNew ? "add" : isCompleting ? "check" : "save"}
                size={22}
                color="white"
              />
              <Text className="text-white text-base font-semibold ml-3">
                {isNew
                  ? "Create Task"
                  : isCompleting
                  ? "Mark Complete"
                  : "Update Task"}
              </Text>
            </TouchableOpacity>
          </View>
        </FormField>
      </ScrollView>
    </View>
  );
};

export default MaintenanceTaskFormScreen;
