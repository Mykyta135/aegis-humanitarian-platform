import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { Coordinates } from "./use-task";
export enum ResourceCondition {
  EXCELLENT = "excellent",
  GOOD = "good",
  NEEDS_MAINTENANCE = "needs_maintenance",
  INOPERABLE = "inoperable",
}
export enum ResourceType {
  VEHICLE = 'vehicle',
  GENERATOR = 'generator',
  DRONE = 'drone',
  MEDICAL_KIT = 'medical_kit',
}
export type Resource = {
  id: string;
  name: string;
  type: ResourceType | null;
  location: Coordinates | null;
  condition: ResourceCondition | null;
  status: "available" | "in_use" | "maintenance";
};

const getResources = async (
  filters: Record<string, any>
): Promise<Resource[]> => {
  const response = await api.get("/resources", {
    params: filters,
  });
  return response.data;
};

export const useResources = (filters: Record<string, any>) => {
  return useQuery({
    queryKey: ["resources", filters],
    queryFn: () => getResources(filters),
  });
};
