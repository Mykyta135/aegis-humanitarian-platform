import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { Coordinates } from "./use-task";

export type Volunteer = {
  id: string;
  name: string;
  skills: string[];
  status: "available" | "on_mission" | "unavailable";
  homeBase?: Coordinates;
  experienceLevel?: "trainee" | "junior" | "senior" | "expert";
  languages?: string[];
  notes?: string;
};
const getVolunteers = async (
  filters: Record<string, any>
): Promise<Volunteer[]> => {
  const response = await api.get("/users", {
    params: filters,
  });
  return response.data;
};

export const useVolunteers = (filters: Record<string, any>) => {
  return useQuery({
    queryKey: ["volunteers", filters],
    queryFn: () => getVolunteers(filters),
  });
};
