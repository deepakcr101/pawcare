// frontend/src/types/appointment.ts (New file or add to existing types)

export interface PetBasic { // Or import your existing Pet type if more detailed
  id: string;
  name: string;
  species?: string;
}

export interface UserBasic { // For owner/staff representation
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ServiceBasic { // Or import your existing Service type
  id: string;
  name: string;
  price?: number | string; // Prisma Decimal can be string or number
  type?: string; // VETERINARY, GROOMING etc.
  durationMinutes?: number;
}

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'NO_SHOW';

export interface Appointment {
  id: string;
  dateTime: string; // ISO date string
  status: AppointmentStatus;
  notes?: string | null;
  petId: string;
  pet: PetBasic;
  ownerId: string;
  owner: UserBasic;
  serviceId: string;
  service: ServiceBasic;
  staffId: string;
  staff?: UserBasic | null; // Staff might be optional or not always included fully
  createdAt: string;
  updatedAt: string;
}

// Matches backend CreateAppointmentDto
export interface CreateAppointmentPayload {
  petId: string;
  serviceId: string;
  dateTime: string; // ISO string, e.g., "2025-07-15T14:30:00.000Z"
  staffId: string;
  notes?: string;
}

// Matches backend UpdateAppointmentDto (simplified for frontend)
export interface UpdateAppointmentPayload {
  newDateTime?: string; // If rescheduling, use new ISO string
  status?: AppointmentStatus;
  staffId?: string;
  notes?: string;
  // Note: Backend DTO has newAppointmentDate & newAppointmentTime separately.
  // For frontend, sending a single newDateTime is cleaner.
  // The backend service update method would need to handle this (or frontend splits it).
  // For now, let's assume frontend sends newDateTime if changing.
}

export interface AvailableSlot {
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  staffId: string;
  staffName: string;
}