// frontend/src/pages/appointments/BookAppointmentPage.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// API functions
import { getServices } from '../../api/serviceService'; // Assuming you created this
import { getAvailableSlots, createAppointment } from '../../api/appointmentService';
import { getMyPets } from '../../api/petService'; // We'll need a way to fetch user's pets
// Types
import { ServiceBasic, AvailableSlot, CreateAppointmentPayload, PetBasic } from '../../types/appointment'; // And Pet type

const BookAppointmentPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(''); // Format: YYYY-MM-DD
  const [selectedStaffId, setSelectedStaffId] = useState<string>(''); // Optional
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [notes, setNotes] = useState<string>('');

// Fetch Services
const { data: services, isLoading: isLoadingServices } = useQuery\<ServiceBasic[], Error\>({
queryKey: ['services'],
queryFn: getServices,
});

// Fetch User's Pets (You'll need a petService.ts with getMyPets function)
const { data: pets, isLoading: isLoadingPets } = useQuery\<PetBasic[], Error\>({
queryKey: ['myPets'],
queryFn: getMyPets, // Example: () =\> apiClient.get\<PetBasic[]\>('/pets/my').then(res =\> res.data)
// enabled: \!\!user, // Assuming you have user context to enable this
});

// Fetch Available Slots - enabled only when service and date are selected
const {
data: availableSlots,
isLoading: isLoadingSlots,
isError: isErrorSlots,
error: slotsError,
refetch: refetchSlots, // To manually refetch if needed
} = useQuery\<AvailableSlot[], Error\>({
queryKey: ['availableSlots', selectedServiceId, selectedDate, selectedStaffId],
queryFn: () =\> {
if (\!selectedServiceId || \!selectedDate) {
return Promise.resolve([]); // Or throw an error if you prefer
}
return getAvailableSlots(selectedServiceId, selectedDate, selectedStaffId || undefined);
},
enabled: \!\!selectedServiceId && \!\!selectedDate, // Only run query if these are set
retry: false, // Don't retry automatically if slots aren't found
});

// Mutation for creating an appointment
const createAppointmentMutation = useMutation\<any, Error, CreateAppointmentPayload\>({
mutationFn: createAppointment,
onSuccess: () =\> {
alert('Appointment booked successfully\!');
// Invalidate queries to refetch data, e.g., user's appointments list
queryClient.invalidateQueries({ queryKey: ['appointments'] }); // If you have an appointments list
queryClient.invalidateQueries({ queryKey: ['availableSlots', selectedServiceId, selectedDate, selectedStaffId] });
setSelectedSlot(null);
// Reset form if needed
},
onError: (error) =\> {
alert(`Failed to book appointment: ${error.message}`);
},
});

const handleDateChange = (e: React.ChangeEvent&lt;HTMLInputElement&gt;) =\> {
setSelectedDate(e.target.value);
setSelectedSlot(null); // Reset selected slot when date changes
};

const handleServiceChange = (e: React.ChangeEvent&lt;HTMLSelectElement&gt;) =\> {
setSelectedServiceId(e.target.value);
setSelectedSlot(null); // Reset selected slot
setSelectedStaffId(''); // Reset staff if service changes
};

const handlePetChange = (e: React.ChangeEvent&lt;HTMLSelectElement&gt;) =\> {
setSelectedPetId(e.target.value);
};

const handleBookAppointment = () =\> {
if (\!selectedSlot || \!selectedPetId || \!selectedServiceId || \!selectedDate || \!selectedSlot.staffId) {
alert('Please select a service, date, pet, and a time slot.');
return;
}
const payload: CreateAppointmentPayload = {
petId: selectedPetId,
serviceId: selectedServiceId,
dateTime: selectedSlot.startTime, // Use the startTime from the selected slot
staffId: selectedSlot.staffId,
notes: notes,
};
createAppointmentMutation.mutate(payload);
};

// --- UI Rendering ---
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Book an Appointment</h1>

      <div className="mb-4">
        <label htmlFor="service" className="block text-sm font-medium text-gray-700">
          Select Service:
        </label>
        <select
          id="service"
          value={selectedServiceId}
          onChange={handleServiceChange}
          disabled={isLoadingServices}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
        >
          <option value="">
            {isLoadingServices ? 'Loading services...' : '-- Select Service --'}
          </option>
          {services?.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} ({service.durationMinutes} min) - ${service.price}
            </option>
          ))}
        </select>
      </div>

      {/* Date Selection */}
      <div className="mb-4">
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Select Date:
        </label>
        <input
          type="date"
          id="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
          min={new Date().toISOString().split('T')[0]} // Optional: prevent selecting past dates
        />
      </div>

      {/* TODO: Optional Staff Selection Dropdown (populated based on selectedServiceId) */}

      {/* Available Slots Display */}
      {selectedServiceId && selectedDate && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Available Slots for {selectedDate}:</h3>
          {isLoadingSlots && <p>Loading slots...</p>}
          {isErrorSlots && (
            <p className="text-red-500">Error fetching slots: {slotsError?.message}</p>
          )}
          {!isLoadingSlots && !isErrorSlots && availableSlots && availableSlots.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.startTime}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-2 border rounded-md text-sm ${
                    selectedSlot?.startTime === slot.startTime
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {new Date(slot.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                  <br />
                  <span className="text-xs">({slot.staffName})</span>
                </button>
              ))}
            </div>
          ) : (
            !isLoadingSlots && <p>No slots available for this service on the selected date.</p>
          )}
        </div>
      )}

      {/* Pet Selection */}
      {selectedSlot && (
        <div className="mb-4">
          <label htmlFor="pet" className="block text-sm font-medium text-gray-700">
            Select Your Pet:
          </label>
          <select
            id="pet"
            value={selectedPetId}
            onChange={handlePetChange}
            disabled={isLoadingPets}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
          >
            <option value="">
              {isLoadingPets ? 'Loading pets...' : '-- Select Pet --'}
            </option>
            {pets?.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name} ({pet.species})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Notes */}
      {selectedSlot && selectedPetId && (
        <div className="mb-4">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes (Optional):
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
      )}

      {/* Booking Button */}
      {selectedSlot && selectedPetId && (
        <button
          onClick={handleBookAppointment}
          disabled={createAppointmentMutation.isPending}
          className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-md shadow hover:bg-green-700 disabled:opacity-50"
        >
          {createAppointmentMutation.isPending ? 'Booking...' : 'Book Appointment'}
        </button>
      )}
    </div>
  );
};

export default BookAppointmentPage;