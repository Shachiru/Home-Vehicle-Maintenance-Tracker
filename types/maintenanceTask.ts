import { MaintenanceCategory } from "./maintenanceCategory";

export interface MaintenanceTask {
  id: string;
  vehicleId: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  dueDate?: Date;
  dueMileage?: number;
  completed: boolean;
  completedAt?: Date;
  completedMileage?: number;
  cost?: number;
  receipts?: string[];
  notes?: string;
  partsList?: string[];
  difficulty?: "easy" | "medium" | "hard";
  createdAt?: Date;
  updatedAt?: Date;
}
