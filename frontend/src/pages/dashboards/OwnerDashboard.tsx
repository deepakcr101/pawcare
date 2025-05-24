// frontend/src/pages/dashboards/OwnerDashboard.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api';
import CreatePetForm from '../../components/CreatePetForm';
import PetDetail from '../pets/PetDetail';
import type { Pet } from '../../types/pet';

const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreatePetForm, setShowCreatePetForm] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  const fetchOwnerPets = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError('User not authenticated.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Pet[]>('/pets/my');
      setPets(response.data);
    } catch (err: any) {
      console.error("Failed to fetch owner's pets:", err);
      setError(err.response?.data?.message || 'Failed to load your pets.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOwnerPets();
  }, [fetchOwnerPets]);

  const handlePetAdded = () => {
    setShowCreatePetForm(false);
    fetchOwnerPets();
  };

  const handlePetUpdated = (updatedPet: Pet) => {
    setPets((prevPets) =>
      prevPets.map((p) => (p.id === updatedPet.id ? updatedPet : p))
    );
    setSelectedPet(updatedPet);
  };

  const handlePetDeleted = (deletedPetId: string) => {
    setPets((prevPets) => prevPets.filter((p) => p.id !== deletedPetId));
    setSelectedPet(null);
  };

  if (loading) {
    return (
      <div className="text-center mt-10 text-lg text-gray-600">
        Loading pets...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-10 text-red-500 text-lg">
        Error: {error}
      </div>
    );
  }

  if (selectedPet) {
    return (
      <PetDetail
        pet={selectedPet}
        onUpdate={handlePetUpdated}
        onDelete={handlePetDeleted}
        onCancel={() => setSelectedPet(null)}
      />
    );
  }

  if (showCreatePetForm) {
    return (
      <CreatePetForm
        onPetAdded={handlePetAdded}
        onCancel={() => setShowCreatePetForm(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">
        Owner Dashboard
      </h2>

      <p className="text-lg text-gray-600 mb-6">
        Welcome to your dashboard, {user?.firstName}! Here you can manage your pets and appointments.
      </p>

      <div className="mb-6">
        <button
          onClick={() => setShowCreatePetForm(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Add New Pet
        </button>
      </div>

      {pets.length === 0 ? (
        <p className="text-gray-700">
          You don't have any pets registered yet. Click <span className="font-semibold">"Add New Pet"</span> to get started!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
          {pets.map((pet) => (
            <div
              key={pet.id}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50 cursor-pointer shadow-sm hover:shadow-md transition-shadow duration-200"
              onClick={() => setSelectedPet(pet)}
            >
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                {pet.name}
              </h4>
              <p className="text-gray-700">Species: {pet.species}</p>
              <p className="text-gray-700">Breed: {pet.breed || 'N/A'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
