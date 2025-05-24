import React, { useState } from 'react';
import apiClient from '../../api';
import { useAuth } from '../../context/AuthContext';

interface AddPetFormProps {
  onPetAdded: () => void;
  onCancel: () => void;
}

function AddPetForm({ onPetAdded, onCancel }: AddPetFormProps) {
  useAuth();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [vaccinationHistory, setVaccinationHistory] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setSuccess(null);
  setLoading(true);

  const petData: any = {
    name,
    species,
  };

  if (breed) petData.breed = breed;
  if (dateOfBirth) petData.dateOfBirth = dateOfBirth;

  if (medicalHistory && medicalHistory.trim() !== '') {
    try {
      JSON.parse(medicalHistory); // just check if it's valid
      petData.medicalHistory = medicalHistory;
    } catch {
      setError('Medical history must be valid JSON.');
      setLoading(false);
      return;
    }
  }

  if (vaccinationHistory && vaccinationHistory.trim() !== '') {
    try {
      JSON.parse(vaccinationHistory); // just check if it's valid
      petData.vaccinationHistory = vaccinationHistory;
    } catch {
      setError('Vaccination history must be valid JSON.');
      setLoading(false);
      return;
    }
  }

  try {
    await apiClient.post('/pets', petData);
    setSuccess('Pet added successfully!');
    setName('');
    setSpecies('');
    setBreed('');
    setAge('');
    setDateOfBirth('');
    setMedicalHistory('');
    setVaccinationHistory('');
    onPetAdded();
  } catch (err: any) {
    console.error('Error adding pet:', err);
    setError(err.response?.data?.message || 'Failed to add pet. Please check your input.');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Add New Pet</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
          <input
            type="text"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
          <input
            type="text"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Medical History (JSON format)</label>
          <textarea
            value={medicalHistory}
            onChange={(e) => setMedicalHistory(e.target.value)}
            rows={3}
            placeholder='e.g., {"allergies": ["dust"], "conditions": ["arthritis"]}'
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
          ></textarea>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Vaccination History (JSON format)</label>
          <textarea
            value={vaccinationHistory}
            onChange={(e) => setVaccinationHistory(e.target.value)}
            rows={3}
            placeholder='e.g., {"rabies": "2024-05-01", "distemper": "2023-11-15"}'
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
          ></textarea>
        </div>
        <div className="md:col-span-2 flex gap-3 mt-2">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Adding...' : 'Add Pet'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md bg-gray-500 hover:bg-gray-600 text-white"
          >
            Cancel
          </button>
        </div>
        {error && (
          <p className="md:col-span-2 text-red-600 text-sm mt-2">{error}</p>
        )}
        {success && (
          <p className="md:col-span-2 text-green-600 text-sm mt-2">{success}</p>
        )}
      </form>
    </div>
  );
}

export default AddPetForm;
