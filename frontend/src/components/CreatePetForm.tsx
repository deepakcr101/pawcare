// frontend/src/components/CreatePetForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // To get apiClient
import type { Pet } from '../types/pet'; // We'll define this type soon if it doesn't exist

// Define the shape of data for creating a pet
interface CreatePetFormData {
  name: string;
  species: string;
  breed?: string;
  dateOfBirth: string; // YYYY-MM-DD format for input type="date"
  medicalHistory?: string; // Send as JSON string
  vaccinationHistory?: string; // Send as JSON string
  avatarUrl?: string;
  // Add other fields from your CreatePetDto if you want to include them in the form
  // gender?: string;
  // color?: string;
  // weightKg?: number; // Note: input type="number" gives a number, but DTO expects string for IsNumber?
  // notes?: string;
}

const CreatePetForm: React.FC = () => {
  const { apiClient, user } = useAuth(); // Destructure both apiClient and user only once
  const [formData, setFormData] = useState<CreatePetFormData>({
    name: '',
    species: '',
    dateOfBirth: '',
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    // Prepare data for backend
    // Make sure all properties here match your CreatePetDto in the backend
    // (name, species, dateOfBirth, breed?, medicalHistory?, vaccinationHistory?, avatarUrl?)
    const dataToSend: CreatePetFormData = { // Use your defined interface for type safety
        name: formData.name,
        species: formData.species,
        dateOfBirth: formData.dateOfBirth,
        // Optional fields - only include them if they have values or if your DTO handles undefined/null
        ...(formData.breed && { breed: formData.breed }),
        ...(formData.avatarUrl && { avatarUrl: formData.avatarUrl }),
        // Ensure medicalHistory and vaccinationHistory are valid JSON strings if provided
        // or handle their parsing/stringification more robustly if they are complex objects in the form state.
    };

    // Conditionally add medicalHistory if it exists and is potentially a JSON string
    if (formData.medicalHistory) {
        let medicalHistoryString = formData.medicalHistory;
        try {
            // Check if it's already a valid JSON string. If not, attempt to wrap it.
            JSON.parse(medicalHistoryString);
        } catch (e) {
            // If parsing fails and it's just plain text, you might want to structure it.
            // This example assumes if it's not JSON, it's a note.
            // Or, ensure your input method for medicalHistory produces a JSON string directly.
            medicalHistoryString = JSON.stringify({ notes: formData.medicalHistory });
        }
        (dataToSend as any).medicalHistory = medicalHistoryString; // Add it to dataToSend
    }


    // Conditionally add vaccinationHistory
    if (formData.vaccinationHistory) {
        let vaccinationHistoryString = formData.vaccinationHistory;
        try {
            JSON.parse(vaccinationHistoryString);
        } catch (e) {
            vaccinationHistoryString = JSON.stringify({ notes: formData.vaccinationHistory });
        }
        (dataToSend as any).vaccinationHistory = vaccinationHistoryString; // Add it to dataToSend
    }


    // DO NOT ADD ownerId to dataToSend
    // const ownerId = user?.userId; // Or user?.id, user?.sub - whatever your AuthContext provides as the user's ID
    // The backend will get the ownerId from the JWT token.

    try {
      console.log("Payload being sent to /pets:", dataToSend); // For debugging the exact payload
      const response = await apiClient.post<Pet>('/pets', dataToSend); // Send dataToSend WITHOUT ownerId
      setSuccessMessage(`Pet "${response.data.name}" added successfully!`);
      setFormData({ name: '', species: '', dateOfBirth: '' }); // Clear form
    } catch (error: any) {
      console.error('Failed to add pet:', error);
      if (error.response && error.response.data && error.response.data.message) {
        const message = error.response.data.message;
        // Handle cases where 'message' might be an array of validation errors
        setErrorMessage(Array.isArray(message) ? message.join(', ') : message);
      } else {
        setErrorMessage('Failed to add pet. Please try again.');
      }
    } finally {
      setLoading(false);
    }
};

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Pet</h3>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {successMessage}
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setSuccessMessage(null)}>
            <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{errorMessage}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setErrorMessage(null)}>
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Pet Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Pet Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* Species */}
        <div>
          <label htmlFor="species" className="block text-sm font-medium text-gray-700">Species:</label>
          <input
            type="text"
            id="species"
            name="species"
            value={formData.species}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* Breed (Optional) */}
        <div>
          <label htmlFor="breed" className="block text-sm font-medium text-gray-700">Breed (Optional):</label>
          <input
            type="text"
            id="breed"
            name="breed"
            value={formData.breed || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth:</label>
          <input
            type="date" // Use type="date" for a date picker
            id="dateOfBirth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* Medical History (Optional - as JSON string) */}
        <div>
            <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700">Medical History (Optional, JSON format/notes):</label>
            <textarea
                id="medicalHistory"
                name="medicalHistory"
                value={formData.medicalHistory || ''}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., {'allergies': ['dust'], 'conditions': ['arthritis']}"
            ></textarea>
        </div>

        {/* Vaccination History (Optional - as JSON string) */}
        <div>
            <label htmlFor="vaccinationHistory" className="block text-sm font-medium text-gray-700">Vaccination History (Optional, JSON format/notes):</label>
            <textarea
                id="vaccinationHistory"
                name="vaccinationHistory"
                value={formData.vaccinationHistory || ''}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., {'rabies': '2024-01-15', 'distemper': '2023-05-20'}"
            ></textarea>
        </div>

        {/* Avatar URL (Optional) */}
        <div>
          <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700">Avatar URL (Optional):</label>
          <input
            type="text"
            id="avatarUrl"
            name="avatarUrl"
            value={formData.avatarUrl || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>


        {/* Submit Button */}
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={loading}
        >
          {loading ? 'Adding Pet...' : 'Add Pet'}
        </button>
      </form>
    </div>
  );
};

export default CreatePetForm;