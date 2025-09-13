export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate?: string;
  mileage: number;
  fuelType?: string;
  engineType?: string;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
