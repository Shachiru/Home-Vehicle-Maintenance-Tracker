import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { UserProfile } from "@/types/userProfile"; // Import your existing UserProfile type

// Define the auth context type with added methods
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signin: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string, name?: string) => Promise<User>;
  signout: () => Promise<void>;
  updateUserData: (data: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Create or get the user profile from Firestore
  const getUserProfile = async (user: User): Promise<UserProfile> => {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // User document exists, return the data
      return userDoc.data() as UserProfile;
    } else {
      // Create a new user profile document
      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        phoneNumber: "",
        createdAt: serverTimestamp(),
        vehiclesCount: 0,
        maintenanceTasksCount: 0,
      };

      // Create the document
      await setDoc(userDocRef, newUserProfile);

      // Return the new profile with a JavaScript Date for createdAt since serverTimestamp()
      // doesn't return a value until after the document is committed
      return {
        ...newUserProfile,
        createdAt: new Date(),
      };
    }
  };

  // Update user profile in Firestore
  const updateUserData = async (data: Partial<UserProfile>): Promise<void> => {
    if (!user) {
      throw new Error("No authenticated user");
    }

    try {
      const userDocRef = doc(db, "users", user.uid);

      // Check if the document exists first
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        // Update the existing document
        await updateDoc(userDocRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });

        // Update local state
        setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
      } else {
        // Create the document if it doesn't exist
        const newProfile = await getUserProfile(user);
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      throw error;
    }
  };

  // Sign in method
  const signin = async (email: string, password: string): Promise<User> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  // Sign up method
  const signup = async (
    email: string,
    password: string,
    name?: string
  ): Promise<User> => {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Set the display name if provided
      if (name) {
        await updateProfile(result.user, {
          displayName: name,
        });
      }

      // Create the user profile in Firestore
      await getUserProfile(result.user);

      return result.user;
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  // Sign out method
  const signout = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  // Method to refresh the current user
  const refreshUser = async (): Promise<void> => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
        setUser({ ...auth.currentUser });

        if (auth.currentUser) {
          const refreshedProfile = await getUserProfile(auth.currentUser);
          setUserProfile(refreshedProfile);
        }
      } catch (error) {
        console.error("Error refreshing user:", error);
        throw error;
      }
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("User Data:", firebaseUser);
      try {
        setLoading(true);

        if (firebaseUser) {
          setUser(firebaseUser);

          // Get or create the user profile
          const profile = await getUserProfile(firebaseUser);
          setUserProfile(profile);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user,
    signin,
    signup,
    signout,
    updateUserData,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
