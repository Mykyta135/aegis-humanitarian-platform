"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { toast } from "sonner";

// This DTO shape must match the backend's CreateUserDto
interface CreateVolunteerDto {
  name: string;
  email: string;
  password: string; // Required by backend
  role: "admin" | "volunteer";
  experienceLevel: string;
  homeBase: { lat: number; lng: number };
  skills: string[];
  languages: string[];
}

const createVolunteer = async (data: CreateVolunteerDto): Promise<any> => {
  const response = await api.post("/users", data);
  return response.data;
};

export const useCreateVolunteer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVolunteer,
    onSuccess: (data) => {
      toast.success(
        `Volunteer "${data.name}" has been onboarded successfully.`
      );
      // Invalidate queries that use volunteer data to ensure UI consistency
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      queryClient.invalidateQueries({ queryKey: ["analyticsData"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || "Failed to onboard volunteer.";
      toast.error(`Error: ${errorMessage}`);
    },
  });
};
