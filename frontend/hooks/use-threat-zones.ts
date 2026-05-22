"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export interface ThreatZone {
  id: string;
  name: string;
  type: "occupied" | "contested" | "alert" | "danger";
  severity: "low" | "medium" | "high" | "critical";
  geometry: GeoJSON.Geometry;
  source: string;
  updatedAt: string;
}

const getThreatZones = async (): Promise<ThreatZone[]> => {
  const { data } = await api.get("/threat-zones");
  return data;
};

export const useThreatZones = () => {
  return useQuery({
    queryKey: ["threatZones"],
    queryFn: getThreatZones,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
};
