"use client";

import { api } from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { type Coordinates } from "@/hooks/use-tasks";

interface SuggestionRequest {
  region: string;
  difficulty: string;
  requiredSkills: string[];
}

export interface Suggestion {
  id: string;
  name: string;
  experienceLevel: string;
  homeBase: Coordinates | null;
  score: number;
  reasons: string[];
}

interface SuggestionResponse {
  volunteers: Suggestion[];
  resources: any[];
}

const findSuggestions = async (
  params: SuggestionRequest
): Promise<SuggestionResponse> => {
  const response = await api.post("/suggestions/tasks", params);
  return response.data;
};

export const useTaskSuggestions = () => {
  return useMutation<SuggestionResponse, Error, SuggestionRequest>({
    mutationFn: findSuggestions,
    onSuccess: () => {
      toast.success("Found best matches for the mission.");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || "Failed to find suggestions.";
      toast.error(errorMessage);
    },
  });
};
