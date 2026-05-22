"use client";

import { api } from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const addTaskLog = async (taskId: string, message: string, author?: string) => {
  const { data } = await api.post(`/tasks/${taskId}/logs`, { message, author });
  return data;
};

export const useAddTaskLog = (taskId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ message, author }: { message: string; author?: string }) =>
      addTaskLog(taskId, message, author),
    onSuccess: () => {
      toast.success("Log entry added.");
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
    onError: () => toast.error("Failed to add log entry."),
  });
};
