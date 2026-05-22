"use client";

import { api } from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const deleteResource = async (id: string): Promise<void> => {
  await api.delete(`/resources/${id}`);
};

export const useDeleteResource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteResource,
    onSuccess: () => {
      toast.success("Resource removed.");
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message ?? "Failed to remove resource.");
    },
  });
};
