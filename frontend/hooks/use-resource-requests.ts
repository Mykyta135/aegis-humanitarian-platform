"use client";

import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type ResourceRequest = {
  id: string;
  taskId: string;
  resourceId: string;
  requesterId: string;
  status: "pending" | "approved" | "rejected";
  message?: string;
  createdAt: string;
  requester?: { id: string; name: string };
  resource?: { id: string; name: string; type: string };
  task?: { id: string; title: string };
};

export const useTaskResourceRequests = (taskId: string) =>
  useQuery<ResourceRequest[]>({
    queryKey: ["resource-requests", "task", taskId],
    queryFn: async () => (await api.get(`/resource-requests/task/${taskId}`)).data,
    enabled: !!taskId,
  });

export const useSendResourceRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { taskId: string; resourceId: string; message?: string }) =>
      api.post("/resource-requests", body).then((r) => r.data),
    onSuccess: (_, vars) => {
      toast.success("Resource request sent");
      queryClient.invalidateQueries({ queryKey: ["resource-requests", "task", vars.taskId] });
    },
    onError: () => toast.error("Failed to send resource request"),
  });
};

export const useRespondToResourceRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      api.patch(`/resource-requests/${id}/respond`, { approve }).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(data.status === "approved" ? "Resource approved!" : "Resource request rejected");
      queryClient.invalidateQueries({ queryKey: ["resource-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", data.taskId] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: () => toast.error("Failed to respond to resource request"),
  });
};
