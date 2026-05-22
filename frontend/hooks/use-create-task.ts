"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import { useTaskFormStore } from "@/stores/use-task-form.store";

type CreateTaskDto = {
  title: string;
  description: string;
  region: string;
  assigneeId?: string;
  resourceIds?: string[];
  [key: string]: any;
};

const createTask = async (taskData: CreateTaskDto) => {
  const response = await api.post("/tasks", taskData);
  return response.data;
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  const resetFormStore = useTaskFormStore((state) => state.reset);

  return useMutation({
    mutationFn: createTask,
    onSuccess: (data) => {
      toast.success(`Task "${data.title}" created successfully!`);

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardInsights"] }); // Also invalidate insights

      resetFormStore();
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || "An unexpected error occurred.";
      toast.error(`Failed to create task: ${errorMessage}`);
    },
  });
};
