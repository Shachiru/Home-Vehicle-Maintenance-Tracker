import { auth, db } from "@/firebase";
import { Task } from "@/types/task";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

// Check if user is authenticated
const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  return user;
};

// Get user-specific tasks collection
const getUserTasksCollection = () => {
  const user = getCurrentUser();
  return collection(db, "users", user.uid, "tasks");
};

export const createTask = async (task: Omit<Task, "id">) => {
  const user = getCurrentUser();
  console.log("Creating task for user:", user.uid);

  const tasksCollection = getUserTasksCollection();
  const docRef = await addDoc(tasksCollection, {
    ...task,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: user.uid, // Add user ID for extra security
  });

  console.log("Task created with ID:", docRef.id);
  return docRef;
};

export const getAllTaskData = async (): Promise<Task[]> => {
  const tasksCollection = getUserTasksCollection();
  const snapshot = await getDocs(tasksCollection);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Task[];
};

export const getTaskById = async (id: string): Promise<Task | null> => {
  const user = getCurrentUser();
  const taskDoc = doc(db, "users", user.uid, "tasks", id);
  const snapshot = await getDoc(taskDoc);

  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Task;
  }
  return null;
};

export const updateTask = async (id: string, updates: Partial<Task>) => {
  const user = getCurrentUser();
  const taskDoc = doc(db, "users", user.uid, "tasks", id);
  return await updateDoc(taskDoc, {
    ...updates,
    updatedAt: new Date(),
  });
};

export const deleteTask = async (id: string) => {
  const user = getCurrentUser();
  const taskDoc = doc(db, "users", user.uid, "tasks", id);
  return await deleteDoc(taskDoc);
};

// For real-time listeners
export const getUserTasksColRef = () => getUserTasksCollection();
