"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export interface RouteAlternative {
  id: string;
  profile: string;
  label: string;
  safetyTag: string;
  route: string;
  distanceKm: number;
  durationMin: number;
  safetyScore: number;
  threatExposure: { zoneName: string; severity: string }[];
  recommended: boolean;
}

const getRouteAlternatives = async (taskId: string): Promise<RouteAlternative[]> => {
  const { data } = await api.get(`/tasks/${taskId}/route-alternatives`);
  return data;
};

export const useRouteAlternatives = (taskId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["routeAlternatives", taskId],
    queryFn: () => getRouteAlternatives(taskId),
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};
