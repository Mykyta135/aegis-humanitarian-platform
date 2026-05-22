"use client";

import { api } from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const deleteVolunteer = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};

export const useDeleteVolunteer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVolunteer,
    onSuccess: () => {
      toast.success("Volunteer removed.");
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message ?? "Failed to remove volunteer.");
    },
  });
};
