import {
  View,
  Text,
  Alert,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { signin } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const SignIn = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (isLoading) return;

    // Basic validation
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    await signin(email, password)
      .then((res) => {
        router.push("/home");
      })
      .catch((err) => {
        Alert.alert("Login failed", "Something went wrong");
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleSignUp = () => {
    router.push("/signup");
  };

  const handleForgotPassword = () => {
    router.push("/forgotpassword");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View className="flex-1 bg-blue-50">
      {/* Background Decoration */}
      <View className="absolute inset-0">
        {/* Top Blue Circle */}
        <View
          className="absolute w-80 h-80 rounded-full bg-blue-100/60"
          style={{ top: -150, right: -100 }}
        />
        {/* Bottom Blue Circle */}
        <View
          className="absolute w-96 h-96 rounded-full bg-blue-200/40"
          style={{ bottom: -200, left: -150 }}
        />
        {/* Middle Accent Circle */}
        <View
          className="absolute w-64 h-64 rounded-full bg-blue-300/30"
          style={{ top: height * 0.4, right: -80 }}
        />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            }}
          >
            {/* Header Section with Logo */}
            <View className="items-center mb-12">
              {/* Logo Container */}
              <Animated.View
                style={{
                  opacity: logoAnim,
                  transform: [{ scale: logoAnim }],
                }}
                className="mb-8"
              >
                <View className="w-40 h-40 rounded-3xl bg-white shadow-2xl justify-center items-center p-4 border-4 border-blue-100">
                  <Image
                    source={require("@/assets/images/logo.png")}
                    style={{
                      width: 120,
                      height: 120,
                      resizeMode: "contain",
                    }}
                  />
                </View>
              </Animated.View>

              {/* App Name */}
              <Text className="text-2xl font-black text-blue-900 mb-3 tracking-wider text-center">
                Vehicle Maintenance Tracker
              </Text>
              <View className="w-32 h-1 bg-blue-500 rounded-full mb-4" />
              <Text className="text-lg text-blue-700 text-center font-medium leading-6">
                Your Complete Vehicle{"\n"}Care Solution
              </Text>
            </View>

            {/* Main Card */}
            <View className="bg-white/95 border border-blue-100 rounded-3xl p-8 shadow-2xl mx-2">
              {/* Welcome Text */}
              <View className="items-center mb-10">
                <Text className="text-3xl font-bold text-blue-900 mb-2">
                  Welcome Back
                </Text>
                <Text className="text-base text-blue-600 text-center">
                  Sign in to continue your journey
                </Text>
              </View>

              {/* Form Container */}
              <View>
                {/* Email Input */}
                <View className="mb-6">
                  <Text className="text-blue-900 font-semibold text-base mb-3 ml-2">
                    Email Address
                  </Text>
                  <View className="relative">
                    <View className="bg-blue-50 border-2 border-blue-200 rounded-2xl overflow-hidden">
                      <View className="flex-row items-center">
                        <Ionicons
                          name="mail-outline"
                          size={20}
                          color="#60A5FA"
                          style={{ marginLeft: 16 }}
                        />
                        <TextInput
                          className="flex-1 px-4 py-4 text-blue-900 text-base"
                          placeholder="Enter your email"
                          placeholderTextColor="#60A5FA"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                        />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Password Input with Toggle */}
                <View className="mb-6">
                  <Text className="text-blue-900 font-semibold text-base mb-3 ml-2">
                    Password
                  </Text>
                  <View className="relative">
                    <View className="bg-blue-50 border-2 border-blue-200 rounded-2xl overflow-hidden">
                      <View className="flex-row items-center">
                        <Ionicons
                          name="lock-closed-outline"
                          size={20}
                          color="#60A5FA"
                          style={{ marginLeft: 16 }}
                        />
                        <TextInput
                          className="flex-1 px-4 py-4 text-blue-900 text-base"
                          placeholder="Enter your password"
                          placeholderTextColor="#60A5FA"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                          autoComplete="password"
                        />
                        <Pressable
                          onPress={togglePasswordVisibility}
                          className="px-4 py-4"
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons
                            name={
                              showPassword ? "eye-off-outline" : "eye-outline"
                            }
                            size={22}
                            color="#60A5FA"
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Forgot Password */}
                <View className="items-end mb-8">
                  <Pressable onPress={handleForgotPassword}>
                    <Text className="text-blue-600 font-medium text-base underline">
                      Forgot Password?
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Sign In Button */}
              <View className="mb-8">
                <Pressable
                  className={`rounded-2xl py-5 px-6 shadow-lg ${
                    isLoading ? "bg-blue-300" : "bg-blue-600"
                  }`}
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={{
                    shadowColor: "#1D4ED8",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <View className="flex-row items-center justify-center">
                    {isLoading && (
                      <Ionicons
                        name="refresh-outline"
                        size={20}
                        color="#DBEAFE"
                        style={{ marginRight: 8 }}
                      />
                    )}
                    <Text
                      className={`text-center font-bold text-xl ${
                        isLoading ? "text-blue-100" : "text-white"
                      }`}
                    >
                      {isLoading ? "Signing In..." : "Sign In"}
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* Divider */}
              <View className="flex-row items-center mb-8">
                <View className="flex-1 h-px bg-blue-200" />
                <View className="px-6">
                  <Text className="text-blue-500 font-medium text-base bg-white px-4">
                    OR
                  </Text>
                </View>
                <View className="flex-1 h-px bg-blue-200" />
              </View>

              {/* Sign Up Link */}
              <View className="flex-row justify-center items-center">
                <Text className="text-blue-700 text-base mr-2">
                  Don't have an account?
                </Text>
                <Pressable onPress={handleSignUp}>
                  <View className="flex-row items-center">
                    <Text className="text-blue-600 font-bold text-base underline mr-1">
                      Sign Up
                    </Text>
                    <Ionicons
                      name="arrow-forward-outline"
                      size={16}
                      color="#2563EB"
                    />
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Bottom Decoration */}
            <View className="items-center mt-8">
              <View className="flex-row space-x-3">
                <View className="w-3 h-3 rounded-full bg-blue-300" />
                <View className="w-3 h-3 rounded-full bg-blue-500" />
                <View className="w-3 h-3 rounded-full bg-blue-300" />
              </View>
              <View className="flex-row items-center mt-4">
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color="#3B82F6"
                />
                <Text className="text-blue-500 text-sm ml-2 font-medium">
                  Secure • Reliable • Fast
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignIn;
