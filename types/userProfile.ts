export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: any;
  updatedAt?: any;
  vehiclesCount: number;
  maintenanceTasksCount: number;
}
