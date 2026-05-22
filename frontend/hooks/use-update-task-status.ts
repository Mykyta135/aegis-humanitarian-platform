"use client";

import { api } from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type UpdateTaskPayload = {
  id: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
};

const updateTaskStatus = async ({ id, status }: UpdateTaskPayload) => {
  const response = await api.patch(`/tasks/${id}/status`, { status });
  return response.data;
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTaskStatus,
    onSuccess: (data) => {
      toast.success(`Task "${data.title}" marked as ${data.status}.`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", data.id] });
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || "An unexpected error occurred.";
      toast.error(`Failed to update task: ${errorMessage}`);
    },
  });
};
