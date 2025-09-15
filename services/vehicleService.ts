import { auth, db } from "@/firebase";
import { MaintenanceTask } from "@/types/maintenanceTask";
import { Vehicle } from "@/types/vehicle";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

// Helper function to remove undefined fields
const removeUndefinedFields = (obj: any) => {
  const result = { ...obj };
  Object.keys(result).forEach((key) => {
    if (result[key] === undefined) {
      delete result[key];
    } else if (typeof result[key] === "object" && result[key] !== null) {
      result[key] = removeUndefinedFields(result[key]);
    }
  });
  return result;
};

// Check if user is authenticated
const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  return user;
};

// Get user-specific vehicles collection
const getUserVehiclesCollection = () => {
  const user = getCurrentUser();
  return collection(db, "users", user.uid, "vehicles");
};

// Get maintenance tasks collection for a specific vehicle
const getVehicleMaintenanceCollection = (vehicleId: string) => {
  const user = getCurrentUser();
  return collection(
    db,
    "users",
    user.uid,
    "vehicles",
    vehicleId,
    "maintenanceTasks"
  );
};

// Vehicle CRUD operations
export const createVehicle = async (vehicle: Omit<Vehicle, "id">) => {
  const user = getCurrentUser();

  // Clean data before sending to Firestore
  const cleanData = removeUndefinedFields(vehicle);

  const vehiclesCollection = getUserVehiclesCollection();
  const docRef = await addDoc(vehiclesCollection, {
    ...cleanData,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: user.uid,
  });

  console.log("Vehicle created with ID:", docRef.id);
  return docRef;
};

export const getAllVehicles = async (): Promise<Vehicle[]> => {
  try {
    // First try the nested collection structure
    const nestedCollection = getUserVehiclesCollection();
    const nestedSnapshot = await getDocs(nestedCollection);

    const nestedVehicles = nestedSnapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() } as Vehicle;
    });

    if (nestedVehicles.length > 0) {
      console.log("Found vehicles in nested structure");
      return nestedVehicles;
    }

    // If no vehicles found, try the flat collection with a query
    console.log("No vehicles in nested structure, trying flat structure");
    const flatCollection = collection(db, "vehicles");
    const flatQuery = query(
      flatCollection,
      where("userId", "==", auth.currentUser?.uid)
    );
    const flatSnapshot = await getDocs(flatQuery);

    const flatVehicles = flatSnapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() } as Vehicle;
    });

    console.log(`Found ${flatVehicles.length} vehicles in flat structure`);
    return flatVehicles;
  } catch (error) {
    console.error("Error getting vehicles:", error);
    throw error;
  }
};

export const getVehicleById = async (id: string): Promise<Vehicle | null> => {
  const user = getCurrentUser();
  const vehicleDoc = doc(db, "users", user.uid, "vehicles", id);
  const snapshot = await getDoc(vehicleDoc);

  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Vehicle;
  }
  return null;
};

export const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
  const user = getCurrentUser();

  // Clean data before sending to Firestore
  const cleanUpdates = removeUndefinedFields(updates);

  const vehicleDoc = doc(db, "users", user.uid, "vehicles", id);
  return await updateDoc(vehicleDoc, {
    ...cleanUpdates,
    updatedAt: new Date(),
  });
};

export const updateVehicleMileage = async (id: string, newMileage: number) => {
  if (newMileage <= 0) {
    throw new Error("Mileage must be a positive number");
  }

  const vehicle = await getVehicleById(id);
  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  // Ensure mileage is only increasing
  if (newMileage < vehicle.mileage) {
    throw new Error("New mileage cannot be less than current mileage");
  }

  return updateVehicle(id, { mileage: newMileage });
};

export const deleteVehicle = async (id: string) => {
  const user = getCurrentUser();
  const vehicleDoc = doc(db, "users", user.uid, "vehicles", id);
  return await deleteDoc(vehicleDoc);
};

// Maintenance tasks CRUD operations
export const createMaintenanceTask = async (
  vehicleId: string,
  task: Omit<MaintenanceTask, "id" | "vehicleId">
) => {
  const user = getCurrentUser();

  const cleanTask = removeUndefinedFields(task);

  const tasksCollection = getVehicleMaintenanceCollection(vehicleId);
  const docRef = await addDoc(tasksCollection, {
    ...cleanTask,
    vehicleId,
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: user.uid,
  });

  console.log("Maintenance task created with ID:", docRef.id);
  return docRef;
};

export const getMaintenanceTasks = async (
  vehicleId: string,
  filterCompleted?: boolean
): Promise<MaintenanceTask[]> => {
  const tasksCollection = getVehicleMaintenanceCollection(vehicleId);

  let q = query(tasksCollection, orderBy("createdAt", "desc"));

  if (filterCompleted !== undefined) {
    q = query(
      tasksCollection,
      where("completed", "==", filterCompleted),
      orderBy("createdAt", "desc")
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as MaintenanceTask[];
};

export const getUpcomingMaintenanceTasks = async (
  vehicleId: string
): Promise<MaintenanceTask[]> => {
  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  const tasks = await getMaintenanceTasks(vehicleId, false);
  const currentDate = new Date();

  return tasks.filter((task) => {
    // Due by date
    if (task.dueDate && new Date(task.dueDate) <= currentDate) {
      return true;
    }

    // Due by mileage
    if (task.dueMileage && vehicle.mileage >= task.dueMileage) {
      return true;
    }

    return false;
  });
};

export const getMaintenanceTaskById = async (
  vehicleId: string,
  taskId: string
): Promise<MaintenanceTask | null> => {
  const user = getCurrentUser();
  const taskDoc = doc(
    db,
    "users",
    user.uid,
    "vehicles",
    vehicleId,
    "maintenanceTasks",
    taskId
  );
  const snapshot = await getDoc(taskDoc);

  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as MaintenanceTask;
  }
  return null;
};

export const updateMaintenanceTask = async (
  vehicleId: string,
  taskId: string,
  updates: Partial<MaintenanceTask>
) => {
  const user = getCurrentUser();

  // Clean data before sending to Firestore
  const cleanUpdates = removeUndefinedFields(updates);

  const taskDoc = doc(
    db,
    "users",
    user.uid,
    "vehicles",
    vehicleId,
    "maintenanceTasks",
    taskId
  );
  return await updateDoc(taskDoc, {
    ...cleanUpdates,
    updatedAt: new Date(),
  });
};

export const completeMaintenanceTask = async (
  vehicleId: string,
  taskId: string,
  completionDetails: {
    completedMileage: number;
    cost?: number;
    notes?: string;
    receipts?: string[];
  }
) => {
  const cleanDetails = removeUndefinedFields(completionDetails);

  return updateMaintenanceTask(vehicleId, taskId, {
    completed: true,
    completedAt: new Date(),
    ...cleanDetails,
  });
};

export const deleteMaintenanceTask = async (
  vehicleId: string,
  taskId: string
) => {
  const user = getCurrentUser();
  const taskDoc = doc(
    db,
    "users",
    user.uid,
    "vehicles",
    vehicleId,
    "maintenanceTasks",
    taskId
  );
  return await deleteDoc(taskDoc);
};

export const getUserVehiclesColRef = () => getUserVehiclesCollection();
export const getVehicleMaintenanceColRef = (vehicleId: string) =>
  getVehicleMaintenanceCollection(vehicleId);
