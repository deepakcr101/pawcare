// frontend/src/pages/pets/PetDetail.tsx
import React, { useState } from 'react';
import type { Pet } from '../../types/pet'; // We'll create this type definition soon
import type { UpdatePetDto } from '../../types/update-pet.dto'; // We'll create this type definition soon
import apiClient from '../../api'; // Your authenticated API client

interface PetDetailProps {
  pet: Pet;
  onUpdate: (updatedPet: Pet) => void;
  onDelete: (petId: string) => void;
  onCancel: () => void; // To go back from detail view
}

function PetDetail({ pet, onUpdate, onDelete, onCancel }: PetDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(pet.name);
  const [species, setSpecies] = useState(pet.species);
  const [breed, setBreed] = useState(pet.breed || '');
  const [age, setAge] = useState(pet.age ? String(pet.age) : '');
  const [dateOfBirth, setDateOfBirth] = useState(pet.dateOfBirth ? new Date(pet.dateOfBirth).toISOString().split('T')[0] : '');
  const [medicalHistory, setMedicalHistory] = useState(pet.medicalHistory ? JSON.stringify(pet.medicalHistory, null, 2) : '');
  const [vaccinationHistory, setVaccinationHistory] = useState(pet.vaccinationHistory ? JSON.stringify(pet.vaccinationHistory, null, 2) : '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const updatedPetData: UpdatePetDto = {
        name,
        species,
        breed: breed || null,
        age: age ? parseInt(age) : null,
        dateOfBirth: dateOfBirth || null,
      };

      // Handle JSON fields
      if (medicalHistory && medicalHistory.trim() !== '') {
        try { updatedPetData.medicalHistory = JSON.parse(medicalHistory); }
        catch { setError('Medical history must be valid JSON.'); setLoading(false); return; }
      } else { updatedPetData.medicalHistory = null; }

      if (vaccinationHistory && vaccinationHistory.trim() !== '') {
        try { updatedPetData.vaccinationHistory = JSON.parse(vaccinationHistory); }
        catch { setError('Vaccination history must be valid JSON.'); setLoading(false); return; }
      } else { updatedPetData.vaccinationHistory = null; }

      const response = await apiClient.patch<Pet>(`/pets/${pet.id}`, updatedPetData);
      onUpdate(response.data); // Update the pet in the parent's state
      setIsEditing(false); // Exit edit mode
    } catch (err: any) {
      console.error('Error updating pet:', err);
      setError(err.response?.data?.message || 'Failed to update pet.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${pet.name}? This action cannot be undone.`)) {
      setLoading(true);
      setError(null);
      try {
        await apiClient.delete(`/pets/${pet.id}`);
        onDelete(pet.id); // Notify parent component to remove pet from list
      } catch (err: any) {
        console.error('Error deleting pet:', err);
        setError(err.response?.data?.message || 'Failed to delete pet.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (isEditing) {
    return (
      <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Edit Pet: {pet.name}</h3>
        <form onSubmit={handleUpdateSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {/* Input fields for editing */}
          <div>
            <label>Name:</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label>Species:</label>
            <input type="text" value={species} onChange={(e) => setSpecies(e.target.value)} required />
          </div>
          <div>
            <label>Breed:</label>
            <input type="text" value={breed} onChange={(e) => setBreed(e.target.value)} />
          </div>
          <div>
            <label>Age (years):</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <label>Date of Birth:</label>
            <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label>Medical History (JSON format):</label>
            <textarea value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} rows={3} placeholder='e.g., {"allergies": ["dust"]}'></textarea>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label>Vaccination History (JSON format):</label>
            <textarea value={vaccinationHistory} onChange={(e) => setVaccinationHistory(e.target.value)} rows={3} placeholder='e.g., {"rabies": "2024-05-01"}'></textarea>
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={loading} style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
          {error && <p style={{ color: 'red', marginTop: '10px', gridColumn: 'span 2' }}>{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #f0f0f0', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
      <h4>{pet.name} Details</h4>
      <p><strong>Species:</strong> {pet.species}</p>
      <p><strong>Breed:</strong> {pet.breed || 'N/A'}</p>
      <p><strong>Age:</strong> {pet.age || 'N/A'} years</p>
      <p><strong>Date of Birth:</strong> {pet.dateOfBirth ? new Date(pet.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
      <p><strong>Medical History:</strong> {pet.medicalHistory ? JSON.stringify(pet.medicalHistory, null, 2) : 'N/A'}</p>
      <p><strong>Vaccination History:</strong> {pet.vaccinationHistory ? JSON.stringify(pet.vaccinationHistory, null, 2) : 'N/A'}</p>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setIsEditing(true)}
          style={{ padding: '8px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </button>
        <button
          onClick={onCancel}
          style={{ padding: '8px 12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Back to List
        </button>
      </div>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
}

export default PetDetail;
