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

const ForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);

  const handleResetPassword = async () => {
    if (isLoading) return;

    // Basic validation
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call for password reset
      // Replace this with your actual password reset service call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setEmailSent(true);
      Alert.alert(
        "Reset Link Sent",
        "We've sent a password reset link to your email address. Please check your inbox and follow the instructions."
      );
    } catch (error) {
      Alert.alert("Error", "Failed to send reset email. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    router.back();
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    handleResetPassword();
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
        <View className="items-center mb-10">
          <View className="w-20 h-20 rounded-full bg-blue-500 justify-center items-center mb-4 shadow-lg">
            <Text className="text-4xl">🔐</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-800 mb-2">
            AutoHome Care
          </Text>
          <Text className="text-base text-gray-600 text-center">
            Vehicle Maintenance Tracker
          </Text>
        </View>

        {/* Forgot Password Form */}
        <View className="bg-white rounded-2xl p-6 shadow-md">
          {!emailSent ? (
            <>
              {/* Title and Description */}
              <View className="items-center mb-8">
                <Text className="text-2xl font-bold text-gray-800 text-center mb-3">
                  Forgot Password?
                </Text>
                <Text className="text-base text-gray-600 text-center leading-6">
                  Don't worry! Enter your email address and we'll send you a
                  link to reset your password.
                </Text>
              </View>

              {/* Email Input */}
              <View className="mb-6">
                <Text className="text-base font-semibold text-gray-800 mb-2">
                  Email Address
                </Text>
                <TextInput
                  className="border border-gray-200 rounded-lg p-4 text-base bg-gray-50 text-gray-800"
                  placeholder="Enter your email address"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoFocus
                />
              </View>

              {/* Reset Password Button */}
              <Pressable
                className={`${
                  isLoading ? "bg-gray-500 opacity-70" : "bg-blue-500"
                } rounded-lg p-4 items-center mb-6 shadow-md`}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                <Text className="text-white text-lg font-bold">
                  {isLoading ? "Sending Reset Link..." : "Send Reset Link"}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              {/* Success State */}
              <View className="items-center mb-8">
                <View className="w-16 h-16 rounded-full bg-green-100 justify-center items-center mb-4">
                  <Text className="text-2xl">✉️</Text>
                </View>
                <Text className="text-2xl font-bold text-gray-800 text-center mb-3">
                  Check Your Email
                </Text>
                <Text className="text-base text-gray-600 text-center leading-6 mb-4">
                  We've sent a password reset link to
                </Text>
                <Text className="text-base font-semibold text-blue-600 text-center mb-4">
                  {email}
                </Text>
                <Text className="text-sm text-gray-500 text-center leading-5">
                  If you don't see the email, check your spam folder or try
                  again.
                </Text>
              </View>

              {/* Resend Email Button */}
              <Pressable
                className="bg-gray-100 border border-gray-300 rounded-lg p-4 items-center mb-4"
                onPress={handleResendEmail}
              >
                <Text className="text-gray-700 text-lg font-semibold">
                  Resend Email
                </Text>
              </Pressable>
            </>
          )}

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-600 text-sm">OR</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Back to Sign In */}
          <Pressable
            className="flex-row justify-center items-center"
            onPress={handleBackToSignIn}
          >
            <Text className="text-gray-600 text-base mr-1">
              Remember your password?{" "}
            </Text>
            <Text className="text-blue-500 text-base font-bold">
              Back to Sign In
            </Text>
          </Pressable>
        </View>

        {/* Additional Help */}
        <View className="mt-8 items-center">
          <Text className="text-sm text-gray-500 text-center leading-5">
            Still having trouble? Contact our support team for assistance.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;
