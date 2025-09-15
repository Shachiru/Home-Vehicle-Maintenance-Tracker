import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/firebase";
import { User } from "firebase/auth";

// User profile type
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt?: Date;
  vehiclesCount?: number;
  maintenanceTasksCount?: number;
}

/**
 * Create a new user profile document in Firestore
 */
export const createUserProfile = async (user: User): Promise<UserProfile> => {
  const userDocRef = doc(db, "users", user.uid);

  // Check if the user document already exists
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    // Create a new user profile
    const newUserProfile: UserProfile = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      phoneNumber: user.phoneNumber || "",
      createdAt: new Date(),
      vehiclesCount: 0,
      maintenanceTasksCount: 0,
    };

    // Set the document (create)
    await setDoc(userDocRef, newUserProfile);
    return newUserProfile;
  }

  // Return existing profile
  return userDoc.data() as UserProfile;
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }

    // If the profile doesn't exist but user is authenticated, create it
    if (auth.currentUser && auth.currentUser.uid === userId) {
      return await createUserProfile(auth.currentUser);
    }

    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

/**
 * Update user profile in Firestore
 */
export const updateUserProfile = async (
  userId: string,
  profileData: Partial<UserProfile>
): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", userId);

    // Check if the user document exists
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // Update existing document
      await updateDoc(userDocRef, {
        ...profileData,
        updatedAt: new Date(),
      });
    } else {
      // Create new document if it doesn't exist
      if (auth.currentUser && auth.currentUser.uid === userId) {
        await createUserProfile(auth.currentUser);

        // Apply updates if there are any beyond the default profile
        if (Object.keys(profileData).length > 0) {
          await updateDoc(userDocRef, {
            ...profileData,
            updatedAt: new Date(),
          });
        }
      }
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * Increment vehicle count for a user
 */
export const incrementVehicleCount = async (
  userId: string,
  amount = 1
): Promise<void> => {
  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const currentCount = userDoc.data().vehiclesCount || 0;
    await updateDoc(userDocRef, {
      vehiclesCount: currentCount + amount,
      updatedAt: new Date(),
    });
  } else {
    // Create the user document first
    if (auth.currentUser && auth.currentUser.uid === userId) {
      const profile = await createUserProfile(auth.currentUser);
      await updateDoc(userDocRef, {
        vehiclesCount: amount,
        updatedAt: new Date(),
      });
    }
  }
};

/**
 * Increment maintenance task count for a user
 */
export const incrementMaintenanceCount = async (
  userId: string,
  amount = 1
): Promise<void> => {
  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const currentCount = userDoc.data().maintenanceTasksCount || 0;
    await updateDoc(userDocRef, {
      maintenanceTasksCount: currentCount + amount,
      updatedAt: new Date(),
    });
  } else {
    // Create the user document first
    if (auth.currentUser && auth.currentUser.uid === userId) {
      const profile = await createUserProfile(auth.currentUser);
      await updateDoc(userDocRef, {
        maintenanceTasksCount: amount,
        updatedAt: new Date(),
      });
    }
  }
};
