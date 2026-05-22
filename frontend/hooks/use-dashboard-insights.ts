"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

type InsightAlert = {
  type: "warning" | "critical";
  message: string;
  source: string;
};

const getInsights = async (): Promise<InsightAlert[]> => {
  const response = await api.get("/dashboard/insights");
  return response.data;
};

export const useDashboardInsights = () => {
  return useQuery({
    queryKey: ["dashboardInsights"],
    queryFn: getInsights,
    refetchInterval: 60 * 1000,
  });
};
