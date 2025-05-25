// Example for frontend/src/api/petService.ts
import apiClient from './index';
import { PetBasic } from '../types/appointment'; // or your more detailed Pet type

export const getMyPets = async (): Promise<PetBasic[]> => {
  const response = await apiClient.get<PetBasic[]>('/pets/my');
  return response.data;
};