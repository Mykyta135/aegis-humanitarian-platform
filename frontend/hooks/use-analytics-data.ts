"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export interface AnalyticsKpis {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  successRate: number;
  totalVolunteers: number;
  availableVolunteers: number;
  totalResources: number;
  availableResources: number;
}

export interface SkillMissionCorrelation {
  skill: string;
  avgMissionsPerVolunteer: number;
  totalMissions: number;
  volunteers: number;
}

export interface AnalyticsData {
  kpis: AnalyticsKpis;
  tasksOverTime: { date: string; created: string; completed: string }[];
  statusBreakdown: { status: string; count: string }[];
  activeVolunteers: { name: string; completedMissions: string }[];
  resourceUtilization: { type: string; inUseCount: string; availableCount: string }[];
  skillDistribution: { skill: string; count: string; available: string }[];
  missionSuccessByRegion: { region: string; successRate: number | null; total: string }[];
  avgMissionDuration: { region: string; avgDurationSeconds: string | null }[];
  durationComparison: { difficulty: string; avgEstimatedHours: string; avgActualHours: string }[];
  missionsByDayOfWeek: { dow: number; region: string; count: string }[];
  priorityBreakdown: { priority: string; count: string; completed: string }[];
  skillMissionCorrelation: SkillMissionCorrelation[];
}

const getAnalyticsData = async (): Promise<AnalyticsData> => {
  const response = await api.get("/dashboard/analytics");
  return response.data;
};

export const useAnalyticsData = () => {
  return useQuery<AnalyticsData>({
    queryKey: ["analyticsData"],
    queryFn: getAnalyticsData,
    staleTime: 1000 * 60 * 5,
  });
};
