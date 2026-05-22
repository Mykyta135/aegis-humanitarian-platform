'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
// We can reuse the type from the use-volunteers hook if it's exported
import { type Volunteer } from '@/hooks/use-volunteers'; 

const getVolunteer = async (id: string): Promise<Volunteer> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const useVolunteer = (id: string) => {
  return useQuery({
    queryKey: ['volunteer', id], // The query key must be unique to this volunteer
    queryFn: () => getVolunteer(id),
    enabled: !!id, // Only run the query if the ID is not null/undefined
  });
};