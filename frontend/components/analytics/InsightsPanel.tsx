"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { AlertTriangle, AlertCircle, Info, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Alert {
  type: "warning" | "critical" | "info";
  message: string;
  source: string;
}

const getInsights = async (): Promise<Alert[]> => {
  const { data } = await api.get("/dashboard/insights");
  return data;
};

const ICON_MAP = {
  critical: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900" },
  warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900" },
};

export function InsightsPanel() {
  const { data: insights, isLoading } = useQuery({
    queryKey: ["insights"],
    queryFn: getInsights,
    staleTime: 1000 * 60 * 2,
  });

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center gap-2">
        <Lightbulb className="h-4 w-4 text-yellow-500" />
        <CardTitle className="text-base">Operational Insights</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {!isLoading && (!insights || insights.length === 0) && (
          <p className="text-sm text-muted-foreground py-2">No active alerts. Operations running normally.</p>
        )}
        {insights && insights.length > 0 && (
          <div className="space-y-2">
            {insights.map((alert, i) => {
              const { icon: Icon, color, bg } = ICON_MAP[alert.type];
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${bg}`}>
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                  <div>
                    <p className="font-medium leading-snug">{alert.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{alert.source}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
