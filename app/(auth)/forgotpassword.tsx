import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const ForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);

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
    <View className="flex-1 bg-white">
      {/* Background Decoration */}
      <View className="absolute inset-0">
        {/* Top Circle */}
        <View
          className="absolute w-80 h-80 rounded-full bg-gray-100"
          style={{ top: -150, right: -100 }}
        />
        {/* Bottom Circle */}
        <View
          className="absolute w-96 h-96 rounded-full bg-gray-200"
          style={{ bottom: -200, left: -150 }}
        />
        {/* Middle Accent Circle */}
        <View
          className="absolute w-64 h-64 rounded-full bg-gray-300"
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
                <View className="w-40 h-40 rounded-3xl bg-white shadow-2xl justify-center items-center p-4 border-4 border-gray-100">
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
              <Text className="text-2xl font-black text-black mb-3 tracking-wider text-center">
                Vehicle Maintenance Tracker
              </Text>
              <View className="w-32 h-1 bg-black rounded-full mb-4" />
              <Text className="text-lg text-black text-center font-medium leading-6">
                Your Complete Vehicle{"\n"}Care Solution
              </Text>
            </View>

            {/* Main Card */}
            <View className="bg-white border border-gray-100 rounded-3xl p-8 shadow-2xl mx-2">
              {!emailSent ? (
                <>
                  {/* Header with Icon */}
                  <View className="items-center mb-10">
                    <View className="w-20 h-20 rounded-2xl bg-gray-100 justify-center items-center mb-6 shadow-lg">
                      <Ionicons
                        name="lock-closed-outline"
                        size={32}
                        color="#000000"
                      />
                    </View>
                    <Text className="text-3xl font-bold text-black mb-2">
                      Forgot Password?
                    </Text>
                    <Text className="text-base text-gray-600 text-center leading-6">
                      Don't worry! Enter your email address{"\n"}and we'll send
                      you a reset link
                    </Text>
                  </View>

                  {/* Email Input */}
                  <View className="mb-8">
                    <Text className="text-black font-semibold text-base mb-3 ml-2">
                      Email Address
                    </Text>
                    <View className="relative">
                      <View className="bg-gray-50 border-2 border-gray-200 rounded-2xl overflow-hidden">
                        <View className="flex-row items-center">
                          <Ionicons
                            name="mail-outline"
                            size={20}
                            color="#000000"
                            style={{ marginLeft: 16 }}
                          />
                          <TextInput
                            className="flex-1 px-4 py-4 text-black text-base"
                            placeholder="Enter your email address"
                            placeholderTextColor="#666666"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoFocus
                          />
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Reset Password Button */}
                  <View className="mb-8">
                    <Pressable
                      className={`rounded-2xl py-5 px-6 shadow-lg ${
                        isLoading ? "bg-gray-300" : "bg-black"
                      }`}
                      onPress={handleResetPassword}
                      disabled={isLoading}
                      style={{
                        shadowColor: "#000000",
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
                            color="#FFFFFF"
                            style={{ marginRight: 8 }}
                          />
                        )}
                        <Text
                          className={`text-center font-bold text-xl ${
                            isLoading ? "text-gray-100" : "text-white"
                          }`}
                        >
                          {isLoading
                            ? "Sending Reset Link..."
                            : "Send Reset Link"}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  {/* Success State */}
                  <View className="items-center mb-10">
                    <View className="w-20 h-20 rounded-2xl bg-green-100 justify-center items-center mb-6 shadow-lg border-2 border-green-200">
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={32}
                        color="#16a34a"
                      />
                    </View>
                    <Text className="text-3xl font-bold text-black mb-3">
                      Check Your Email
                    </Text>
                    <Text className="text-base text-gray-600 text-center leading-6 mb-4">
                      We've sent a password reset link to
                    </Text>
                    <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 mb-4">
                      <Text className="text-base font-semibold text-black text-center">
                        {email}
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-500 text-center leading-5">
                      If you don't see the email, check your{"\n"}spam folder or
                      try again
                    </Text>
                  </View>

                  {/* Resend Email Button */}
                  <View className="mb-8">
                    <Pressable
                      className="bg-gray-100 border-2 border-gray-200 rounded-2xl py-4 px-6 shadow-sm"
                      onPress={handleResendEmail}
                    >
                      <View className="flex-row items-center justify-center">
                        <Ionicons
                          name="refresh-outline"
                          size={20}
                          color="#000000"
                          style={{ marginRight: 8 }}
                        />
                        <Text className="text-black font-bold text-lg">
                          Resend Email
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                </>
              )}

              {/* Divider */}
              <View className="flex-row items-center mb-8">
                <View className="flex-1 h-px bg-gray-200" />
                <View className="px-6">
                  <Text className="text-gray-500 font-medium text-base bg-white px-4">
                    OR
                  </Text>
                </View>
                <View className="flex-1 h-px bg-gray-200" />
              </View>

              {/* Back to Sign In */}
              <View className="flex-row justify-center items-center">
                <Text className="text-black text-base mr-2">
                  Remember your password?
                </Text>
                <Pressable onPress={handleBackToSignIn}>
                  <View className="flex-row items-center">
                    <Text className="text-black font-bold text-base underline mr-1">
                      Back to Sign In
                    </Text>
                    <Ionicons
                      name="arrow-back-outline"
                      size={16}
                      color="#000000"
                    />
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Bottom Decoration */}
            <View className="items-center mt-8">
              <View className="flex-row space-x-3">
                <View className="w-3 h-3 rounded-full bg-gray-300" />
                <View className="w-3 h-3 rounded-full bg-black" />
                <View className="w-3 h-3 rounded-full bg-gray-300" />
              </View>
              <View className="flex-row items-center mt-4">
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color="#000000"
                />
                <Text className="text-gray-500 text-sm ml-2 font-medium">
                  Secure • Reliable • Fast
                </Text>
              </View>
            </View>

            {/* Additional Help */}
            <View className="mt-6 items-center bg-gray-50 border border-gray-100 rounded-2xl p-4 mx-2">
              <View className="flex-row items-center">
                <Ionicons
                  name="help-circle-outline"
                  size={18}
                  color="#666666"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-sm text-gray-600 text-center leading-5">
                  Still having trouble? Contact our support team
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ForgotPassword;
