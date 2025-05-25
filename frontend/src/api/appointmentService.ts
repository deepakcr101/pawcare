// frontend/src/api/appointmentService.ts
import apiClient from &#39;./index&#39;; // Your configured Axios instance
import {
  Appointment,
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
  AvailableSlot,
} from &#39;../types/appointment&#39;; // Assuming types are in src/types/appointment.ts
import apiClient from './index';
import { ServiceBasic } from '../types/appointment';
import { UserBasic } from '../types/appointment'; 


// Fetch available appointment slots
export const getAvailableSlots = async (
serviceId: string,
date: string, // YYYY-MM-DD
staffId?: string,
): Promise\<AvailableSlot[]\> =\> {
const params = new URLSearchParams();
params.append('serviceId', serviceId);
params.append('date', date);
if (staffId) {
params.append('staffId', staffId);
}
const response = await apiClient.get\<AvailableSlot[]\>(`/appointments/available-slots?${params.toString()}`);
return response.data;
};

// Create a new appointment
export const createAppointment = async (payload: CreateAppointmentPayload): Promise&lt;Appointment&gt; =\> {
const response = await apiClient.post&lt;Appointment&gt;('/appointments', payload);
return response.data;
};

// Get all appointments for the logged-in user (owner) or all if admin/staff
// The backend service's findAll method handles role-based filtering
export const getAppointments = async (): Promise\<Appointment[]\> =\> {
const response = await apiClient.get\<Appointment[]\>('/appointments');
return response.data;
};

// Get a single appointment by its ID
export const getAppointmentById = async (appointmentId: string): Promise&lt;Appointment&gt; =\> {
const response = await apiClient.get&lt;Appointment&gt;(`/appointments/${appointmentId}`);
return response.data;
};

// Update an existing appointment
export const updateAppointment = async (
appointmentId: string,
payload: UpdateAppointmentPayload,
): Promise&lt;Appointment&gt; =\> {
// If your backend UpdateAppointmentDto expects separate newAppointmentDate and newAppointmentTime,
// and your frontend UpdateAppointmentPayload has a single newDateTime,
// you might need to transform it here before sending.
// For example:
let backendPayload: any = { ...payload };
if (payload.newDateTime) {
const dateObj = new Date(payload.newDateTime);
backendPayload.newAppointmentDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
backendPayload.newAppointmentTime = `${dateObj.getUTCHours().toString().padStart(2, '0')}:${dateObj.getUTCMinutes().toString().padStart(2, '0')}`; // HH:mm
delete backendPayload.newDateTime; // Remove the frontend-specific field
}

const response = await apiClient.patch&lt;Appointment&gt;(`/appointments/${appointmentId}`, backendPayload);
return response.data;
};

// Cancel (or delete) an appointment
// Backend currently updates status to CANCELLED, so it's more like a PATCH or a specific "cancel" endpoint.
// If using DELETE, ensure backend handles it as a cancellation or actual deletion.
export const cancelAppointment = async (appointmentId: string): Promise&lt;void&gt; =\> {
// If backend handles cancellation via a PATCH to status:
// await apiClient.patch(`/appointments/${appointmentId}`, { status: 'CANCELLED' });
// If backend uses a DELETE endpoint that effectively cancels:
await apiClient.delete(`/appointments/${appointmentId}`);
};

export const getServices = async (): Promise<ServiceBasic[]> => {
  const response = await apiClient.get<ServiceBasic[]>('/services'); // Assuming your backend endpoint is /services
  return response.data;
};

export const getStaffForService = async (serviceId: string): Promise<UserBasic[]> => {
  const response = await apiClient.get<UserBasic[]>(`/staff/service/${serviceId}`);
  return response.data;
};

// You might also want functions to fetch:
// - Services (if not already available from another service file)
// - Staff members qualified for a service