import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { signup } from "@/services/authService";
// Add this import for your Firebase register function
// import { register } from "path/to/your/firebase/auth"; // Update this path to match your project structure

const SignUp = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [cPassword, setCPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return false;
    }

    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return false;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }

    if (!password) {
      Alert.alert("Error", "Please enter a password");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return false;
    }

    if (password !== cPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }

    if (!acceptedTerms) {
      Alert.alert(
        "Error",
        "Please accept the Terms of Service and Privacy Policy"
      );
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (isLoading) return;

    if (!validateForm()) return;

    setIsLoading(true);

    // Use the same logic as your working project
    await signup(email, password)
      .then((res) => {
        // Registration successful
        Alert.alert(
          "Account Created Successfully!",
          "Welcome to AutoHome Care! You can now sign in with your credentials.",
          [
            {
              text: "OK",
              onPress: () => router.push("/signin"),
            },
          ]
        );
      })
      .catch((err) => {
        Alert.alert(
          "Registration failed",
          "Something went wrong. Please try again."
        );
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleSignIn = () => {
    router.push("/signin");
  };

  const handleTermsPress = () => {
    // Navigate to terms and conditions page
    Alert.alert(
      "Terms & Privacy",
      "Terms of Service and Privacy Policy page will open here."
    );
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
        {/* Header Section */}
        <View className="items-center mb-8">
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

        {/* Sign Up Form */}
        <View className="bg-white rounded-2xl p-6 shadow-md">
          <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
            Create Account
          </Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            Join us to start managing your vehicle maintenance
          </Text>

          {/* Full Name Input */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-gray-800 mb-2">
              Full Name
            </Text>
            <TextInput
              className="border border-gray-200 rounded-lg p-4 text-base bg-gray-50 text-gray-800"
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoComplete="name"
            />
          </View>

          {/* Email Input */}
          <View className="mb-4">
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
          <View className="mb-4">
            <Text className="text-base font-semibold text-gray-800 mb-2">
              Password
            </Text>
            <TextInput
              className="border border-gray-200 rounded-lg p-4 text-base bg-gray-50 text-gray-800"
              placeholder="Create a password (min. 6 characters)"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          {/* Confirm Password Input */}
          <View className="mb-5">
            <Text className="text-base font-semibold text-gray-800 mb-2">
              Confirm Password
            </Text>
            <TextInput
              className="border border-gray-200 rounded-lg p-4 text-base bg-gray-50 text-gray-800"
              placeholder="Confirm your password"
              placeholderTextColor="#9CA3AF"
              value={cPassword}
              onChangeText={setCPassword}
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          {/* Terms and Conditions Checkbox */}
          <Pressable
            className="flex-row items-start mb-6"
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            <View
              className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
                acceptedTerms
                  ? "bg-blue-500 border-blue-500"
                  : "border-gray-300"
              }`}
            >
              {acceptedTerms && (
                <Text className="text-white text-xs font-bold">✓</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-sm text-gray-600 leading-5">
                I agree to the{" "}
                <Text
                  className="text-blue-500 font-semibold"
                  onPress={handleTermsPress}
                >
                  Terms of Service
                </Text>{" "}
                and{" "}
                <Text
                  className="text-blue-500 font-semibold"
                  onPress={handleTermsPress}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </Pressable>

          {/* Sign Up Button */}
          <Pressable
            className={`${
              isLoading ? "bg-gray-500 opacity-70" : "bg-blue-500"
            } rounded-lg p-4 items-center mb-6 shadow-md`}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            <Text className="text-white text-lg font-bold">
              {isLoading ? "Creating Account..." : "Create Account"}
            </Text>
          </Pressable>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-600 text-sm">OR</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Sign In Section */}
          <View className="flex-row justify-center items-center">
            <Text className="text-gray-600 text-base">
              Already have an account?{" "}
            </Text>
            <Pressable onPress={handleSignIn}>
              <Text className="text-blue-500 text-base font-bold">Sign In</Text>
            </Pressable>
          </View>
        </View>

        {/* Additional Info */}
        <View className="mt-6 items-center">
          <Text className="text-xs text-gray-500 text-center leading-4 px-4">
            By creating an account, you'll be able to track vehicle maintenance,
            set reminders, and keep detailed service records.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUp;
