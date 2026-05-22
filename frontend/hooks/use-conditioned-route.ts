"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { RouteConditions } from "@/components/maps/OperationsMap";

export interface ConditionedRouteResult {
  route: string | null;
  profile: string;
  distanceKm: number;
  durationMin: number;
  avoidFeatures: string[];
  conditionSummary: string[];
}

const fetchConditionedRoute = async (
  taskId: string,
  conditions: RouteConditions,
): Promise<ConditionedRouteResult> => {
  const params = new URLSearchParams({
    avoidThreatZones: String(conditions.avoidThreatZones),
    weatherSeverity: conditions.weatherSeverity,
    avoidUnpaved: String(conditions.avoidUnpaved),
    nightMode: String(conditions.nightMode),
    vehicleLoad: conditions.vehicleLoad,
  });
  const response = await api.get(`/tasks/${taskId}/route-conditioned?${params}`);
  return response.data as ConditionedRouteResult;
};

function conditionsKey(c: RouteConditions): string {
  return `${c.avoidThreatZones}-${c.weatherSeverity}-${c.avoidUnpaved}-${c.nightMode}-${c.vehicleLoad}`;
}

export const useConditionedRoute = (
  taskId: string,
  hasLocations: boolean,
  conditions: RouteConditions,
) => {
  return useQuery({
    queryKey: ["conditionedRoute", taskId, conditionsKey(conditions)],
    queryFn: () => fetchConditionedRoute(taskId, conditions),
    enabled: hasLocations,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });
};
