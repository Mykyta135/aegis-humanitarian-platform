"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { type Task } from "@/hooks/use-tasks"; // Make sure the Task type is exported and complete
export type { Coordinates } from "@/hooks/use-tasks";

const getTask = async (id: string): Promise<Task> => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

export const useTask = (id: string | undefined | null) => {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => getTask(id!), // The '!' asserts that id will be a string here because of 'enabled'

    enabled: !!id,
  });
};
