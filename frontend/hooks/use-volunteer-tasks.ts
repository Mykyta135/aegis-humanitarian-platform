"use client";

import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export type VolunteerTask = {
  id: string;
  title: string;
  status: string;
  region: string;
  priority: string;
};

const getVolunteerTasks = async (userId: string): Promise<VolunteerTask[]> => {
  const response = await api.get(`/users/${userId}/tasks`);
  return response.data;
};

export const useVolunteerTasks = (userId: string) => {
  return useQuery({
    queryKey: ["volunteerTasks", userId],
    queryFn: () => getVolunteerTasks(userId),
    enabled: !!userId,
  });
};
