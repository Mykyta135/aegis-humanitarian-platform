"use client";

import { api } from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CreateResourceDto {
  name: string;
  type: string;
  condition: string;
  location: { lat: number; lng: number };
  attributes?: Record<string, any>;
  maintenanceSchedule?: Record<string, any>;
}

const createResource = async (data: CreateResourceDto): Promise<any> => {
  const response = await api.post("/resources", data);
  return response.data;
};

export const useCreateResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createResource,
    onSuccess: (data) => {
      toast.success(`Resource "${data.name}" has been added to the pool.`);
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["analyticsData"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardInsights"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || "Failed to add the resource.";
      toast.error(`Error: ${errorMessage}`);
    },
  });
};
