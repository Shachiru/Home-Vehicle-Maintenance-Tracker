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
import { UserProfile } from "@/types/userProfile";

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

  const getUserProfile = async (user: User): Promise<UserProfile> => {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    } else {
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
      return {
        ...newUserProfile,
        createdAt: new Date(),
      };
    }
  };

  const updateUserData = async (data: Partial<UserProfile>): Promise<void> => {
    if (!user) {
      throw new Error("No authenticated user");
    }

    try {
      const userDocRef = doc(db, "users", user.uid);

      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        await updateDoc(userDocRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });

        setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
      } else {
        const newProfile = await getUserProfile(user);
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      throw error;
    }
  };

  const signin = async (email: string, password: string): Promise<User> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

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

      if (name) {
        await updateProfile(result.user, {
          displayName: name,
        });
      }

      await getUserProfile(result.user);

      return result.user;
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signout = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("User Data:", firebaseUser);
      try {
        setLoading(true);

        if (firebaseUser) {
          setUser(firebaseUser);

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
