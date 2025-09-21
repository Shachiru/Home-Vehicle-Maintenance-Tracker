import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLoader } from "@/context/LoaderContext";
import { useTheme } from "@/context/ThemeContext";
import { auth, db } from "@/firebase";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const ProfileScreen = () => {
  const { user } = useAuth();
  const { showLoader, hideLoader } = useLoader();
  const { isDark } = useTheme();

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // User stats
  const [userStats, setUserStats] = useState({
    vehiclesCount: 0,
    maintenanceTasksCount: 0,
    memberSince: "",
  });

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);
        // Load user profile from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setDisplayName(user.displayName || userData.displayName || "");
          setPhoneNumber(userData.phoneNumber || "");
          setEmail(user.email || "");

          // Load profile image from Firestore (base64 string)
          setProfileImage(userData.profileImageBase64 || user.photoURL || null);

          // Set user stats
          setUserStats({
            vehiclesCount: userData.vehiclesCount || 0,
            maintenanceTasksCount: userData.maintenanceTasksCount || 0,
            memberSince: userData.createdAt
              ? new Date(userData.createdAt.toDate()).toLocaleDateString()
              : new Date().toLocaleDateString(),
          });
        } else {
          // Create user document if it doesn't exist
          const newUserProfile = {
            uid: user.uid,
            displayName: user.displayName || "",
            email: user.email || "",
            phoneNumber: "",
            profileImageBase64: null,
            createdAt: new Date(),
            vehiclesCount: 0,
            maintenanceTasksCount: 0,
          };

          await setDoc(userDocRef, newUserProfile);

          setDisplayName(user.displayName || "");
          setEmail(user.email || "");
          setUserStats({
            ...userStats,
            memberSince: new Date().toLocaleDateString(),
          });
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        Alert.alert("Error", "Failed to load profile information");
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [user]);

  const pickImage = async () => {
    try {
      // Request permission first
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "You need to grant access to your photo library to change your profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], // Fixed: Use array format instead of MediaType
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true, // Get base64 directly from ImagePicker
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];

        // Check if we have base64 data
        if (selectedImage.base64) {
          await processImageBase64(selectedImage.base64);
        } else {
          // Fallback: process the URI
          await processImageFromUri(selectedImage.uri);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const processImageBase64 = async (base64: string) => {
    try {
      setIsUploadingImage(true);

      // Create data URI
      const dataUri = `data:image/jpeg;base64,${base64}`;

      // Check if the base64 string is too large (Firestore has 1MB limit per field)
      const sizeInMB = (base64.length * 3) / 4 / (1024 * 1024);
      console.log("Image size:", `${sizeInMB.toFixed(2)}MB`);

      if (sizeInMB > 0.9) {
        // Keep it under 0.9MB to be safe
        Alert.alert(
          "Image Too Large",
          "Please select a smaller image. The image should be under 1MB."
        );
        return;
      }

      setProfileImage(dataUri);
      console.log("Image processed successfully");
    } catch (error) {
      console.error("Error processing base64 image:", error);
      Alert.alert("Error", "Failed to process image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const processImageFromUri = async (uri: string) => {
    try {
      setIsUploadingImage(true);

      // Use expo-image-manipulator to resize and get base64
      const manipulatorResult = await manipulateAsync(
        uri,
        [
          { resize: { width: 300, height: 300 } }, // Resize to reduce file size
        ],
        {
          compress: 0.7,
          format: SaveFormat.JPEG,
          base64: true,
        }
      );

      if (manipulatorResult.base64) {
        // Create data URI
        const dataUri = `data:image/jpeg;base64,${manipulatorResult.base64}`;

        // Check size
        const sizeInMB =
          (manipulatorResult.base64.length * 3) / 4 / (1024 * 1024);
        console.log("Processed image size:", `${sizeInMB.toFixed(2)}MB`);

        if (sizeInMB > 0.9) {
          Alert.alert(
            "Image Too Large",
            "The processed image is still too large. Please try a different image."
          );
          return;
        }

        setProfileImage(dataUri);
        console.log("Image processed from URI successfully");
      }
    } catch (error) {
      console.error("Error processing image from URI:", error);
      Alert.alert("Error", "Failed to process image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      showLoader();

      // Prepare the update data
      const updateData: any = {
        displayName,
        phoneNumber,
        updatedAt: new Date(),
      };

      // Add profile image to update data if it exists and is a base64 string
      if (profileImage && profileImage.startsWith("data:image/")) {
        updateData.profileImageBase64 = profileImage;
        console.log("Saving profile image to Firestore");
      }

      // Update Firestore profile
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, updateData);

      // Update authentication profile (without the base64 image)
      await updateProfile(auth.currentUser!, {
        displayName,
        // Don't update photoURL with base64 string, keep the original or set to null
        photoURL: user.photoURL || null,
      });

      // Force a reload of the current user to get updated profile
      if (auth.currentUser) {
        await auth.currentUser.reload();
      }

      Alert.alert("Success", "Profile updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      // Fixed: Type the error parameter
      console.error("Error saving profile:", error);

      // Provide more specific error messages
      if (error.code === "invalid-argument") {
        Alert.alert(
          "Error",
          "The image is too large. Please select a smaller image."
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to update profile. Please check your internet connection and try again."
        );
      }
    } finally {
      hideLoader();
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !user.email) {
      Alert.alert("Error", "User information is missing");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password should be at least 6 characters");
      return;
    }

    try {
      setIsSaving(true);
      showLoader();

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser!, credential);

      // Change password
      await updatePassword(auth.currentUser!, newPassword);

      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);

      Alert.alert("Success", "Password changed successfully");
    } catch (error: any) {
      console.error("Error changing password:", error);

      if (error.code === "auth/wrong-password") {
        Alert.alert("Error", "Current password is incorrect");
      } else {
        Alert.alert(
          "Error",
          "Failed to change password. Please try again later."
        );
      }
    } finally {
      hideLoader();
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <View
        className={`flex-1 justify-center items-center ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <ActivityIndicator
          size="large"
          color={isDark ? "#60a5fa" : "#3b82f6"}
        />
        <Text className={`mt-4 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
          Loading profile...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className={`flex-1 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <View className="bg-gradient-to-r from-blue-500 to-blue-600 pt-16 pb-8 px-6">
        <Text className="text-white text-2xl font-bold mb-1">Profile</Text>
        <Text className="text-blue-100">Manage your account information</Text>
      </View>

      {/* Profile Section */}
      <View className="px-6 -mt-12">
        <View
          className={`rounded-xl shadow-md p-6 mb-6 ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <View className="items-center mb-4">
            <View className="relative">
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  className={`w-24 h-24 rounded-full border-4 ${
                    isDark ? "border-gray-800" : "border-white"
                  }`}
                  style={{ resizeMode: "cover" }}
                />
              ) : (
                <View
                  className={`w-24 h-24 rounded-full justify-center items-center border-4 ${
                    isDark
                      ? "bg-gray-700 border-gray-800"
                      : "bg-gray-200 border-white"
                  }`}
                >
                  <MaterialIcons
                    name="person"
                    size={50}
                    color={isDark ? "#9ca3af" : "#9ca3af"}
                  />
                </View>
              )}

              {isEditing && (
                <TouchableOpacity
                  onPress={pickImage}
                  className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2"
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <MaterialIcons name="camera-alt" size={18} color="white" />
                  )}
                </TouchableOpacity>
              )}
            </View>

            <Text
              className={`text-xl font-bold mt-2 ${
                isDark ? "text-white" : "text-gray-800"
              }`}
            >
              {displayName || "Set Your Name"}
            </Text>
            <Text className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {email}
            </Text>
          </View>

          <View
            className={`flex-row justify-around mb-4 mt-2 border-t border-b py-3 ${
              isDark ? "border-gray-700" : "border-gray-100"
            }`}
          >
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-500">
                {userStats.vehiclesCount}
              </Text>
              <Text
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Vehicles
              </Text>
            </View>

            <View className="items-center">
              <Text className="text-2xl font-bold text-green-500">
                {userStats.maintenanceTasksCount}
              </Text>
              <Text
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Tasks
              </Text>
            </View>

            <View className="items-center">
              <Text
                className={`text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-800"
                }`}
              >
                Member Since
              </Text>
              <Text
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {userStats.memberSince}
              </Text>
            </View>
          </View>

          {!isEditing ? (
            <TouchableOpacity
              className="bg-blue-500 rounded-full py-2 px-4 self-center"
              onPress={() => setIsEditing(true)}
            >
              <Text className="text-white font-medium">Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row justify-center space-x-3">
              <TouchableOpacity
                className={`rounded-full py-2 px-4 ${
                  isDark ? "bg-gray-700" : "bg-gray-300"
                }`}
                onPress={() => setIsEditing(false)}
                disabled={isSaving || isUploadingImage}
              >
                <Text
                  className={`font-medium ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-blue-500 rounded-full py-2 px-4 flex-row items-center"
                onPress={handleSaveProfile}
                disabled={isSaving || isUploadingImage}
              >
                {isSaving || isUploadingImage ? (
                  <ActivityIndicator
                    size="small"
                    color="white"
                    style={{ marginRight: 5 }}
                  />
                ) : (
                  <MaterialIcons
                    name="check"
                    size={18}
                    color="white"
                    style={{ marginRight: 5 }}
                  />
                )}
                <Text className="text-white font-medium">
                  {isUploadingImage ? "Processing..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Personal Information */}
      <View className="px-6 mb-6">
        <Text
          className={`text-xl font-bold mb-3 ${
            isDark ? "text-white" : "text-gray-800"
          }`}
        >
          Personal Information
        </Text>

        <View
          className={`rounded-xl shadow-md p-5 ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <View className="mb-4">
            <Text
              className={`mb-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              Name
            </Text>
            <TextInput
              className={`border rounded-lg p-3 ${
                isEditing
                  ? isDark
                    ? "border-blue-500 bg-gray-700 text-white"
                    : "border-blue-300 bg-white"
                  : isDark
                  ? "border-gray-700 bg-gray-800 text-gray-400"
                  : "border-gray-200 bg-gray-50"
              }`}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
              editable={isEditing}
            />
          </View>

          <View className="mb-4">
            <Text
              className={`mb-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              Email
            </Text>
            <TextInput
              className={`border rounded-lg p-3 ${
                isDark
                  ? "border-gray-700 bg-gray-800 text-gray-400"
                  : "border-gray-200 bg-gray-50"
              }`}
              value={email}
              placeholder="Your email"
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
              editable={false}
            />
          </View>

          <View className="mb-1">
            <Text
              className={`mb-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              Phone Number
            </Text>
            <TextInput
              className={`border rounded-lg p-3 ${
                isEditing
                  ? isDark
                    ? "border-blue-500 bg-gray-700 text-white"
                    : "border-blue-300 bg-white"
                  : isDark
                  ? "border-gray-700 bg-gray-800 text-gray-400"
                  : "border-gray-200 bg-gray-50"
              }`}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Your phone number"
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
              keyboardType="phone-pad"
              editable={isEditing}
            />
          </View>
        </View>
      </View>

      {/* Password Section */}
      <View className="px-6 mb-8">
        <Text
          className={`text-xl font-bold mb-3 ${
            isDark ? "text-white" : "text-gray-800"
          }`}
        >
          Security
        </Text>

        <View
          className={`rounded-xl shadow-md p-5 ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          {!isChangingPassword ? (
            <TouchableOpacity
              className="flex-row justify-between items-center"
              onPress={() => setIsChangingPassword(true)}
            >
              <View className="flex-row items-center">
                <MaterialIcons
                  name="lock"
                  size={24}
                  color={isDark ? "#d1d5db" : "#4b5563"}
                  style={{ marginRight: 10 }}
                />
                <Text
                  className={`font-medium ${
                    isDark ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Change Password
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={isDark ? "#6b7280" : "#9ca3af"}
              />
            </TouchableOpacity>
          ) : (
            <View>
              <View className="mb-4">
                <Text
                  className={`mb-1 ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Current Password
                </Text>
                <TextInput
                  className={`border rounded-lg p-3 ${
                    isDark
                      ? "border-gray-700 bg-gray-700 text-white"
                      : "border-gray-300 bg-white"
                  }`}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  secureTextEntry
                />
              </View>

              <View className="mb-4">
                <Text
                  className={`mb-1 ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  New Password
                </Text>
                <TextInput
                  className={`border rounded-lg p-3 ${
                    isDark
                      ? "border-gray-700 bg-gray-700 text-white"
                      : "border-gray-300 bg-white"
                  }`}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  secureTextEntry
                />
              </View>

              <View className="mb-5">
                <Text
                  className={`mb-1 ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Confirm New Password
                </Text>
                <TextInput
                  className={`border rounded-lg p-3 ${
                    isDark
                      ? "border-gray-700 bg-gray-700 text-white"
                      : "border-gray-300 bg-white"
                  }`}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  secureTextEntry
                />
              </View>

              <View className="flex-row justify-end space-x-3">
                <TouchableOpacity
                  className={`rounded-full py-2 px-4 ${
                    isDark ? "bg-gray-700" : "bg-gray-300"
                  }`}
                  onPress={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={isSaving}
                >
                  <Text
                    className={`font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-blue-500 rounded-full py-2 px-4 flex-row items-center"
                  onPress={handleChangePassword}
                  disabled={
                    isSaving ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                >
                  {isSaving ? (
                    <ActivityIndicator
                      size="small"
                      color="white"
                      style={{ marginRight: 5 }}
                    />
                  ) : (
                    <MaterialIcons
                      name="lock"
                      size={18}
                      color="white"
                      style={{ marginRight: 5 }}
                    />
                  )}
                  <Text className="text-white font-medium">
                    Update Password
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* App Info */}
      <View className="px-6 mb-8">
        <View
          className={`rounded-xl p-5 border ${
            isDark
              ? "bg-gray-800 border-gray-700"
              : "bg-gray-100 border-gray-200"
          }`}
        >
          <Text
            className={`text-center ${
              isDark ? "text-gray-400" : "text-gray-500"
            } mb-1`}
          >
            Auto Home Care
          </Text>
          <Text
            className={`text-center text-xs ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Version 1.0.0
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;
