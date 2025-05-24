// frontend/src/types/pet.ts
export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  dateOfBirth: string; // Keep as string or convert to Date if you need Date objects on frontend
  medicalHistory?: Record<string, any>; // Assuming it's parsed JSON object
  vaccinationHistory?: Record<string, any>; // Assuming it's parsed JSON object
  avatarUrl?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  // Add other fields from your Pet model like gender, color, weightKg, notes if you implement them
  gender?: string;
  color?: string;
  weightKg?: number;
  notes?: string;
}