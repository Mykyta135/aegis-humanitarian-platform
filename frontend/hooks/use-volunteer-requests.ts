"use client";

import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type VolunteerRequest = {
  id: string;
  taskId: string;
  requesterId: string;
  targetId: string;
  status: "pending" | "accepted" | "rejected";
  message?: string;
  createdAt: string;
  requester?: { id: string; name: string };
  target?: { id: string; name: string };
  task?: { id: string; title: string };
};

export const useTaskRequests = (taskId: string) =>
  useQuery<VolunteerRequest[]>({
    queryKey: ["volunteer-requests", "task", taskId],
    queryFn: async () => (await api.get(`/volunteer-requests/task/${taskId}`)).data,
    enabled: !!taskId,
  });

export const useUserRequests = (userId: string) =>
  useQuery<VolunteerRequest[]>({
    queryKey: ["volunteer-requests", "user", userId],
    queryFn: async () => (await api.get(`/volunteer-requests/user/${userId}`)).data,
    enabled: !!userId,
  });

export const useSendVolunteerRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { taskId: string; requesterId: string; targetId: string; message?: string }) =>
      api.post("/volunteer-requests", body).then((r) => r.data),
    onSuccess: (_, vars) => {
      toast.success("Request sent to volunteer");
      queryClient.invalidateQueries({ queryKey: ["volunteer-requests", "task", vars.taskId] });
    },
    onError: () => toast.error("Failed to send request"),
  });
};

export const useRespondToRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, accept }: { id: string; userId?: string; accept: boolean }) =>
      api.patch(`/volunteer-requests/${id}/respond`, { accept }).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(data.status === "accepted" ? "Mission accepted!" : "Mission declined");
      queryClient.invalidateQueries({ queryKey: ["volunteer-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", data.taskId] });
    },
    onError: () => toast.error("Failed to respond to request"),
  });
};
