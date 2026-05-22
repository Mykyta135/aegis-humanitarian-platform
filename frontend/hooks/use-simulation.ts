"use client";

import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface SimulationStatus {
  taskId: string;
  volunteerId: string;
  volunteerName: string;
  progress: number; // 0-100
  speed: number;
  totalPoints: number;
  currentIndex: number;
}

const getStatus = async (): Promise<SimulationStatus[]> => {
  const { data } = await api.get("/simulation/status");
  return data;
};

export const useSimulationStatus = () =>
  useQuery({
    queryKey: ["simulationStatus"],
    queryFn: getStatus,
    refetchInterval: 1000,
  });

export const useStartSimulation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, speed }: { taskId: string; speed: number }) =>
      api.post(`/simulation/${taskId}/start`, { speedMultiplier: speed }),
    onSuccess: (_, { taskId }) => {
      toast.success("Simulation started");
      qc.invalidateQueries({ queryKey: ["simulationStatus"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to start simulation"),
  });
};

export const useSetSimulationSpeed = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, speed }: { taskId: string; speed: number }) =>
      api.patch(`/simulation/${taskId}/speed`, { speedMultiplier: speed }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["simulationStatus"] }),
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to set speed"),
  });
};

export const useSeekSimulation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, percent }: { taskId: string; percent: number }) =>
      api.patch(`/simulation/${taskId}/seek`, { percent }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["simulationStatus"] }),
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to seek"),
  });
};

export const useStopSimulation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => api.delete(`/simulation/${taskId}/stop`),
    onSuccess: () => {
      toast.success("Simulation stopped");
      qc.invalidateQueries({ queryKey: ["simulationStatus"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to stop simulation"),
  });
};

export const useStopAllSimulations = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete("/simulation/stop-all"),
    onSuccess: () => {
      toast.success("All simulations stopped");
      qc.invalidateQueries({ queryKey: ["simulationStatus"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to stop all"),
  });
};
