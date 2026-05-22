import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export type Coordinates = {
  lat: number;
  lng: number;
};

// The Task type definition is excellent and complete. No changes needed here.
export type TaskLogEntry = {
  timestamp: string;
  message: string;
  author?: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  region: string;
  createdAt: string;
  updatedAt: string;
  startLocation: { lat: number; lng: number } | null;
  endLocation: { lat: number; lng: number } | null;
  estimatedDurationHours: number | null;
  priority: string;
  difficulty: string;
  requiredSkills: string[];
  assignee: { id: string; name: string; email?: string; phone?: string; homeBase?: { lat: number; lng: number } | null } | null;
  creator?: { id: string; name: string; email?: string; phone?: string } | null;
  resources: { id: string; name: string }[];
  logs: TaskLogEntry[];
  creatorId?: string;
};

const getTasks = async (filters: Record<string, any>): Promise<Task[]> => {
  const response = await api.get("/tasks", {
    params: filters,
  });
  return response.data;
};

export const useTasks = (filters: Record<string, any>) => {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => getTasks(filters),
  });
};
