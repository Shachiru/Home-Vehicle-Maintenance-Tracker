import {
  View,
  Text,
  Alert,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { signin } from "@/services/authService";

const SignIn = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 20,
        }}
      >
        {/* Logo/Header Section */}
        <View className="items-center mb-10">
          <View className="w-20 h-20 rounded-full bg-blue-500 justify-center items-center mb-4 shadow-lg">
            <Text className="text-4xl">🚗</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-800 mb-2">
            AutoHome Care
          </Text>
          <Text className="text-base text-gray-600 text-center">
            Your Vehicle Maintenance Companion
          </Text>
        </View>

        {/* Sign In Form */}
        <View className="bg-white rounded-2xl p-6 shadow-md">
          <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
            Welcome Back!
          </Text>
          <Text className="text-base text-gray-600 text-center mb-8">
            Sign in to continue managing your vehicle
          </Text>

          {/* Email Input */}
          <View className="mb-5">
            <Text className="text-base font-semibold text-gray-800 mb-2">
              Email
            </Text>
            <TextInput
              className="border border-gray-200 rounded-lg p-4 text-base bg-gray-50 text-gray-800"
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Password Input */}
          <View className="mb-5">
            <Text className="text-base font-semibold text-gray-800 mb-2">
              Password
            </Text>
            <TextInput
              className="border border-gray-200 rounded-lg p-4 text-base bg-gray-50 text-gray-800"
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {/* Forgot Password Link */}
          <Pressable className="self-end mb-6" onPress={handleForgotPassword}>
            <Text className="text-blue-500 text-sm font-medium">
              Forgot Password?
            </Text>
          </Pressable>

          {/* Sign In Button */}
          <Pressable
            className={`${
              isLoading ? "bg-gray-500 opacity-70" : "bg-blue-500"
            } rounded-lg p-4 items-center mb-6 shadow-md`}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text className="text-white text-lg font-bold">
              {isLoading ? "Signing In..." : "Sign In"}
            </Text>
          </Pressable>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-600 text-sm">OR</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Sign Up Section */}
          <View className="flex-row justify-center items-center">
            <Text className="text-gray-600 text-base">
              Don't have an account?{" "}
            </Text>
            <Pressable onPress={handleSignUp}>
              <Text className="text-blue-500 text-base font-bold">Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignIn;
