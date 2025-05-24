// frontend/src/types/update-pet.dto.ts
// This DTO mirrors the UpdatePetDto on your backend, but all fields are optional
// because it's a PATCH request.
export interface UpdatePetDto {
  name?: string;
  species?: string;
  breed?: string | null;
  age?: number | null;
  dateOfBirth?: string | null;
  medicalHistory?: any | null; // Send as object/JSON string to backend
  vaccinationHistory?: any | null; // Send as object/JSON string to backend
}
