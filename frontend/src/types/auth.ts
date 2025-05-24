// frontend/src/types/auth.ts
// Add or verify this enum
export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  CLINIC_STAFF = 'CLINIC_STAFF',
  GROOMER = 'GROOMER', // Add any other roles you have
}

// Add or verify these interfaces
export interface User {
  userId: string; // The ID from your database for the user
  email: string;
  firstName: string;
  lastName: string;
  role: Role; // Use the Role enum here
  // Add any other user properties returned by your backend upon login/registration
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  firstName: string;
  lastName: string;
  // If your registration also sends a role, add it here:
  // role: Role;
}