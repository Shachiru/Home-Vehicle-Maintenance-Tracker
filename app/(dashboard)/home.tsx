import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  RefreshControl,
  StatusBar,
} from "react-native";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "expo-router";
import {
  getAllVehicles,
  getUpcomingMaintenanceTasks,
} from "@/services/vehicleService";
import { Vehicle } from "@/types/vehicle";
import { MaintenanceTask } from "@/types/maintenanceTask";
import { useAuth } from "@/context/AuthContext";
import { useLoader } from "@/context/LoaderContext";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const HomeScreen = () => {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [upcomingServices, setUpcomingServices] = useState<
    (MaintenanceTask & { vehicleName: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { showLoader, hideLoader } = useLoader();
  const { isDark } = useTheme();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const vehicleCardAnim = useRef(new Animated.Value(0.95)).current;

  // Pure monochromatic palette
  const colors = {
    pure: {
      black: "#000000",
      white: "#FFFFFF",
    },
    background: isDark ? "#000000" : "#FFFFFF",
    card: isDark ? "#0A0A0A" : "#FFFFFF",
    surface: isDark ? "#141414" : "#F8F8F8",
    border: isDark ? "#1A1A1A" : "#EEEEEE",
    text: {
      primary: isDark ? "#FFFFFF" : "#000000",
      secondary: isDark ? "#AAAAAA" : "#666666",
      tertiary: isDark ? "#666666" : "#AAAAAA",
    },
    shadow: {
      color: isDark ? "#000000" : "rgba(0, 0, 0, 0.08)",
      colorStrong: isDark ? "#000000" : "rgba(0, 0, 0, 0.15)",
    },
    accent: "#000000",
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(vehicleCardAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadData = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      showLoader();
      const vehicleData = await getAllVehicles();
      setVehicles(vehicleData);

      if (vehicleData.length > 0) {
        let allUpcomingTasks: (MaintenanceTask & { vehicleName: string })[] =
          [];

        for (const vehicle of vehicleData) {
          try {
            const tasks = await getUpcomingMaintenanceTasks(vehicle.id);
            const tasksWithVehicle = tasks.map((task) => ({
              ...task,
              vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            }));
            allUpcomingTasks = [...allUpcomingTasks, ...tasksWithVehicle];
          } catch (error) {
            console.error(
              "Error loading maintenance for vehicle",
              vehicle.id,
              error
            );
          }
        }

        // Sort by due date first, then by due mileage
        allUpcomingTasks.sort((a, b) => {
          if (a.dueDate && b.dueDate) {
            return (
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            );
          }
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          if (a.dueMileage && b.dueMileage) {
            return a.dueMileage - b.dueMileage;
          }
          return 0;
        });

        setUpcomingServices(allUpcomingTasks.slice(0, 5));
      }
    } catch (error) {
      console.error("Error loading home data:", error);
      Alert.alert(
        "Data Loading Error",
        "Could not load your vehicle data. Please try again."
      );
    } finally {
      hideLoader();
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, user?.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleAddVehicle = () => {
    router.push("../vehicles");
  };

  const handleViewVehicle = (vehicleId: string) => {
    router.push(`/vehicles/${vehicleId}`);
  };

  const handleViewMaintenance = (vehicleId: string) => {
    router.push(`/vehicles/maintenance/${vehicleId}`);
  };

  const handleScheduleService = () => {
    if (vehicles.length > 0) {
      router.push(`/vehicles/maintenance/task/new?vehicleId=${vehicles[0].id}`);
    } else {
      Alert.alert(
        "No Vehicles",
        "Please add a vehicle first before scheduling maintenance."
      );
      router.push("../vehicles");
    }
  };

  const formatDueDate = (task: MaintenanceTask) => {
    if (!task.dueDate) return "Based on mileage";

    const date = new Date(task.dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Overdue";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays < 7) return `Due in ${diffDays} days`;
    if (diffDays < 31) return `Due in ${Math.ceil(diffDays / 7)} weeks`;
    return `Due on ${date.toLocaleDateString()}`;
  };

  const getTaskPriority = (task: MaintenanceTask) => {
    if (!task.dueDate && !task.dueMileage) return "normal";

    if (task.dueDate) {
      const date = new Date(task.dueDate);
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) return "high";
      if (diffDays < 7) return "medium";
    }
    return "normal";
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <ActivityIndicator
          size="large"
          color={isDark ? colors.pure.white : colors.pure.black}
        />
        <Text
          style={{
            marginTop: 16,
            color: colors.text.secondary,
            fontWeight: "500",
          }}
        >
          Loading your garage...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? colors.pure.white : colors.pure.black}
          />
        }
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Header Section */}
          <View
            style={{ paddingTop: 60, paddingHorizontal: 24, marginBottom: 32 }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: "700",
                    color: colors.text.primary,
                    marginBottom: 8,
                    letterSpacing: -0.5,
                  }}
                >
                  {user?.displayName
                    ? `Hello, ${user.displayName.split(" ")[0]}`
                    : "Hello"}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: colors.text.secondary,
                    letterSpacing: -0.2,
                  }}
                >
                  Your vehicle dashboard
                </Text>
              </View>
              <Pressable
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: colors.surface,
                  shadowColor: colors.shadow.color,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 1,
                  shadowRadius: 12,
                  elevation: 5,
                }}
                onPress={() => router.push("../profile")}
              >
                <Ionicons
                  name="person-outline"
                  size={22}
                  color={colors.text.primary}
                />
              </Pressable>
            </View>
          </View>

          {/* Vehicle Section */}
          <View style={{ marginBottom: 40 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 24,
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "600",
                  color: colors.text.primary,
                  letterSpacing: -0.3,
                }}
              >
                My Vehicles
              </Text>
              {vehicles.length > 0 && (
                <Pressable
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  onPress={() => router.push("../vehicles")}
                >
                  <Text
                    style={{
                      color: colors.text.primary,
                      fontWeight: "500",
                      marginRight: 4,
                    }}
                  >
                    View All
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={colors.text.primary}
                  />
                </Pressable>
              )}
            </View>

            {vehicles.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
                decelerationRate="fast"
                snapToInterval={width * 0.85 + 20}
                snapToAlignment="start"
              >
                {vehicles.map((vehicle, index) => (
                  <Animated.View
                    key={vehicle.id}
                    style={{
                      transform: [{ scale: vehicleCardAnim }],
                      width: width * 0.85,
                      marginRight: 20,
                      borderRadius: 24,
                      overflow: "hidden",
                      backgroundColor: colors.card,
                      shadowColor: colors.shadow.colorStrong,
                      shadowOffset: { width: 0, height: 15 },
                      shadowOpacity: 1,
                      shadowRadius: 30,
                      elevation: 20,
                    }}
                  >
                    {/* Vehicle Image Header */}
                    <View
                      style={{
                        height: 180,
                        width: "100%",
                        position: "relative",
                      }}
                    >
                      {vehicle.imageUrl ? (
                        <Image
                          source={{ uri: vehicle.imageUrl }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      ) : (
                        <LinearGradient
                          colors={
                            isDark
                              ? ["#111111", "#222222"]
                              : ["#f3f3f3", "#e0e0e0"]
                          }
                          style={{
                            width: "100%",
                            height: "100%",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Ionicons
                            name="car"
                            size={60}
                            color={colors.text.tertiary}
                          />
                        </LinearGradient>
                      )}

                      {/* Overlay Gradient */}
                      <LinearGradient
                        colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.4)"]}
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: 100,
                        }}
                      />

                      {/* Vehicle Name */}
                      <View
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: 20,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 22,
                            fontWeight: "700",
                            color: colors.pure.white,
                            marginBottom: 4,
                            textShadowColor: "rgba(0,0,0,0.5)",
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 4,
                          }}
                        >
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </Text>
                        {vehicle.licensePlate && (
                          <View
                            style={{
                              backgroundColor: "rgba(255,255,255,0.25)",
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                              borderRadius: 8,
                              alignSelf: "flex-start",
                              backdropFilter: "blur(10px)",
                            }}
                          >
                            <Text
                              style={{
                                color: colors.pure.white,
                                fontSize: 13,
                                fontWeight: "600",
                              }}
                            >
                              {vehicle.licensePlate}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Vehicle Info Section */}
                    <View style={{ padding: 20 }}>
                      <View style={{ marginBottom: 24 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 16,
                          }}
                        >
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.03)",
                              justifyContent: "center",
                              alignItems: "center",
                              marginRight: 14,
                            }}
                          >
                            <Ionicons
                              name="speedometer-outline"
                              size={20}
                              color={colors.text.primary}
                            />
                          </View>
                          <View>
                            <Text
                              style={{
                                fontSize: 13,
                                color: colors.text.secondary,
                                marginBottom: 2,
                              }}
                            >
                              Mileage
                            </Text>
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: "600",
                                color: colors.text.primary,
                              }}
                            >
                              {vehicle.mileage
                                .toString()
                                .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" "}
                              miles
                            </Text>
                          </View>
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                          }}
                        >
                          {vehicle.engineType && (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                flex: 1,
                                marginRight: 12,
                              }}
                            >
                              <View
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 20,
                                  backgroundColor: isDark
                                    ? "rgba(255,255,255,0.05)"
                                    : "rgba(0,0,0,0.03)",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  marginRight: 14,
                                }}
                              >
                                <Ionicons
                                  name="construct-outline"
                                  size={18}
                                  color={colors.text.primary}
                                />
                              </View>
                              <View>
                                <Text
                                  style={{
                                    fontSize: 13,
                                    color: colors.text.secondary,
                                    marginBottom: 2,
                                  }}
                                >
                                  Engine
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 16,
                                    fontWeight: "600",
                                    color: colors.text.primary,
                                  }}
                                  numberOfLines={1}
                                >
                                  {vehicle.engineType}
                                </Text>
                              </View>
                            </View>
                          )}

                          {vehicle.fuelType && (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                flex: 1,
                              }}
                            >
                              <View
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 20,
                                  backgroundColor: isDark
                                    ? "rgba(255,255,255,0.05)"
                                    : "rgba(0,0,0,0.03)",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  marginRight: 14,
                                }}
                              >
                                <Ionicons
                                  name="flash-outline"
                                  size={20}
                                  color={colors.text.primary}
                                />
                              </View>
                              <View>
                                <Text
                                  style={{
                                    fontSize: 13,
                                    color: colors.text.secondary,
                                    marginBottom: 2,
                                  }}
                                >
                                  Fuel
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 16,
                                    fontWeight: "600",
                                    color: colors.text.primary,
                                  }}
                                >
                                  {vehicle.fuelType}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={{ flexDirection: "row" }}>
                        <Pressable
                          style={{
                            flex: 1,
                            marginRight: 10,
                            height: 50,
                            borderRadius: 12,
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: isDark
                              ? colors.pure.white
                              : colors.pure.black,
                            shadowColor: colors.shadow.color,
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.5,
                            shadowRadius: 8,
                            elevation: 4,
                          }}
                          onPress={() => handleViewMaintenance(vehicle.id)}
                        >
                          <Text
                            style={{
                              color: isDark
                                ? colors.pure.black
                                : colors.pure.white,
                              fontWeight: "600",
                              fontSize: 15,
                            }}
                          >
                            Maintenance
                          </Text>
                        </Pressable>
                        <Pressable
                          style={{
                            flex: 1,
                            height: 50,
                            borderRadius: 12,
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "transparent",
                            borderWidth: 1,
                            borderColor: isDark
                              ? "rgba(255,255,255,0.15)"
                              : "rgba(0,0,0,0.15)",
                          }}
                          onPress={() => handleViewVehicle(vehicle.id)}
                        >
                          <Text
                            style={{
                              color: colors.text.primary,
                              fontWeight: "600",
                              fontSize: 15,
                            }}
                          >
                            Details
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </ScrollView>
            ) : (
              <View style={{ marginHorizontal: 24 }}>
                <Pressable
                  style={{
                    borderRadius: 24,
                    overflow: "hidden",
                    backgroundColor: colors.card,
                    shadowColor: colors.shadow.colorStrong,
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 1,
                    shadowRadius: 20,
                    elevation: 10,
                  }}
                  onPress={handleAddVehicle}
                >
                  <LinearGradient
                    colors={
                      isDark ? ["#111111", "#222222"] : ["#f5f5f5", "#e0e0e0"]
                    }
                    style={{ padding: 32, alignItems: "center" }}
                  >
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 24,
                        shadowColor: colors.shadow.color,
                        shadowOffset: { width: 0, height: 5 },
                        shadowOpacity: 0.5,
                        shadowRadius: 10,
                      }}
                    >
                      <Ionicons
                        name="car-outline"
                        size={40}
                        color={colors.text.primary}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: "700",
                        color: colors.text.primary,
                        marginBottom: 12,
                        textAlign: "center",
                      }}
                    >
                      No vehicles yet
                    </Text>
                    <Text
                      style={{
                        color: colors.text.secondary,
                        textAlign: "center",
                        marginBottom: 24,
                        fontSize: 15,
                        lineHeight: 22,
                      }}
                    >
                      Add your first vehicle to start tracking maintenance and
                      service history
                    </Text>
                    <Pressable
                      style={{
                        paddingHorizontal: 32,
                        height: 56,
                        borderRadius: 16,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: isDark
                          ? colors.pure.white
                          : colors.pure.black,
                        shadowColor: colors.shadow.colorStrong,
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.5,
                        shadowRadius: 12,
                        elevation: 6,
                      }}
                      onPress={handleAddVehicle}
                    >
                      <Text
                        style={{
                          color: isDark ? colors.pure.black : colors.pure.white,
                          fontWeight: "700",
                          fontSize: 16,
                        }}
                      >
                        Add Vehicle
                      </Text>
                    </Pressable>
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </View>

          {/* Maintenance Section */}
          <View style={{ marginBottom: 40, paddingHorizontal: 24 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "600",
                color: colors.text.primary,
                marginBottom: 20,
                letterSpacing: -0.3,
              }}
            >
              Upcoming Maintenance
            </Text>

            {upcomingServices.length > 0 ? (
              <View>
                {upcomingServices.map((service, index) => {
                  const priority = getTaskPriority(service);
                  const priorityColors = {
                    high: "#FF3B30",
                    medium: "#FF9500",
                    normal: "#007AFF",
                  };
                  const color = priorityColors[priority];

                  return (
                    <Pressable
                      key={service.id}
                      style={{
                        marginBottom: 16,
                        borderRadius: 18,
                        backgroundColor: colors.card,
                        shadowColor: colors.shadow.color,
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.8,
                        shadowRadius: 16,
                        elevation: 4,
                        overflow: "hidden",
                      }}
                      onPress={() =>
                        router.push(
                          `/vehicles/maintenance/${service.vehicleId}`
                        )
                      }
                    >
                      <View
                        style={{
                          padding: 20,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 18,
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: isDark
                              ? `${color}15`
                              : `${color}10`,
                            marginRight: 16,
                          }}
                        >
                          <Ionicons
                            name="build-outline"
                            size={24}
                            color={color}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 17,
                              fontWeight: "600",
                              color: colors.text.primary,
                              marginBottom: 4,
                            }}
                          >
                            {service.title}
                          </Text>
                          <Text
                            style={{
                              fontSize: 15,
                              color: colors.text.secondary,
                              marginBottom: 8,
                            }}
                          >
                            {service.vehicleName}
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <View
                              style={{
                                height: 8,
                                width: 8,
                                borderRadius: 4,
                                backgroundColor: color,
                                marginRight: 8,
                                shadowColor: color,
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.6,
                                shadowRadius: 4,
                              }}
                            />
                            <Text
                              style={{
                                fontSize: 14,
                                color: colors.text.secondary,
                                fontWeight: "500",
                              }}
                            >
                              {formatDueDate(service)}
                              {service.dueMileage &&
                                ` • ${service.dueMileage.toLocaleString()} miles`}
                            </Text>
                          </View>
                        </View>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: isDark
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(0,0,0,0.03)",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={colors.text.secondary}
                          />
                        </View>
                      </View>

                      {/* Colored bottom indicator */}
                      <View
                        style={{
                          height: 3,
                          backgroundColor: color,
                          width: "100%",
                        }}
                      />
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View
                style={{
                  borderRadius: 24,
                  overflow: "hidden",
                  backgroundColor: colors.card,
                  shadowColor: colors.shadow.color,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.8,
                  shadowRadius: 16,
                  elevation: 4,
                }}
              >
                <LinearGradient
                  colors={
                    isDark ? ["#111111", "#222222"] : ["#f5f5f5", "#e0e0e0"]
                  }
                  style={{ padding: 32, alignItems: "center" }}
                >
                  <View
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 35,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.05)",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 20,
                      shadowColor: colors.shadow.color,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={36}
                      color={colors.text.primary}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: colors.text.primary,
                      marginBottom: 8,
                      textAlign: "center",
                    }}
                  >
                    No upcoming services
                  </Text>
                  <Text
                    style={{
                      color: colors.text.secondary,
                      textAlign: "center",
                      fontSize: 15,
                    }}
                  >
                    All caught up with maintenance!
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={{ paddingHorizontal: 24 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "600",
                color: colors.text.primary,
                marginBottom: 20,
                letterSpacing: -0.3,
              }}
            >
              Quick Actions
            </Text>
            <View style={{ flexDirection: "row" }}>
              <Pressable
                style={{
                  flex: 1,
                  borderRadius: 20,
                  marginRight: 12,
                  backgroundColor: isDark
                    ? colors.pure.white
                    : colors.pure.black,
                  shadowColor: colors.shadow.colorStrong,
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.6,
                  shadowRadius: 16,
                  elevation: 8,
                  overflow: "hidden",
                }}
                onPress={handleScheduleService}
              >
                <View style={{ padding: 24, alignItems: "center" }}>
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: isDark
                        ? "rgba(0,0,0,0.1)"
                        : "rgba(255,255,255,0.2)",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={28}
                      color={isDark ? colors.pure.black : colors.pure.white}
                    />
                  </View>
                  <Text
                    style={{
                      color: isDark ? colors.pure.black : colors.pure.white,
                      fontWeight: "700",
                      fontSize: 17,
                      textAlign: "center",
                    }}
                  >
                    Schedule Service
                  </Text>
                </View>
              </Pressable>
              <Pressable
                style={{
                  flex: 1,
                  borderRadius: 20,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                  shadowColor: colors.shadow.color,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 4,
                }}
                onPress={() =>
                  Alert.alert(
                    "Coming Soon",
                    "Find Parts feature will be available in a future update."
                  )
                }
              >
                <View style={{ padding: 24, alignItems: "center" }}>
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.03)",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons
                      name="search-outline"
                      size={28}
                      color={colors.text.primary}
                    />
                  </View>
                  <Text
                    style={{
                      color: colors.text.primary,
                      fontWeight: "700",
                      fontSize: 17,
                      textAlign: "center",
                    }}
                  >
                    Find Parts
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
