"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export interface SnappedCoordinate {
  lat: number;
  lng: number;
  distanceM: number;
  wasSnapped: boolean;
}

export interface RouteResult {
  route: string | null;
  snappedStart: SnappedCoordinate;
  snappedEnd: SnappedCoordinate;
}

const getTaskRoute = async (taskId: string): Promise<RouteResult> => {
  const response = await api.get(`/tasks/${taskId}/route`);
  return response.data as RouteResult;
};

export const useTaskRoute = (taskId: string, isEnabled: boolean) => {
  return useQuery({
    queryKey: ["taskRoute", taskId],
    queryFn: () => getTaskRoute(taskId),
    enabled: isEnabled,
    retry: false,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
  });
};
