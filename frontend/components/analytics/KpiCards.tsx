"use client";

import { Card, CardContent } from "@/components/ui/card";
import { type AnalyticsKpis } from "@/hooks/use-analytics-data";
import {
  CheckCircle2,
  Clock,
  PackageCheck,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

interface KpiCardsProps {
  kpis: AnalyticsKpis | undefined;
}

export function KpiCards({ kpis }: KpiCardsProps) {
  if (!kpis) return null;

  const cards = [
    {
      label: "Total Missions",
      value: kpis.totalTasks,
      sub: `${kpis.inProgressTasks} in progress`,
      icon: Clock,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Success Rate",
      value: `${kpis.successRate}%`,
      sub: `${kpis.completedTasks} completed`,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-950/30",
    },
    {
      label: "Volunteers",
      value: kpis.totalVolunteers,
      sub: `${kpis.availableVolunteers} available`,
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      label: "Available Volunteers",
      value: kpis.availableVolunteers,
      sub: `of ${kpis.totalVolunteers} total`,
      icon: Zap,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/30",
    },
    {
      label: "Resources",
      value: kpis.totalResources,
      sub: `${kpis.availableResources} available`,
      icon: PackageCheck,
      color: "text-teal-500",
      bg: "bg-teal-50 dark:bg-teal-950/30",
    },
    {
      label: "Completed",
      value: kpis.completedTasks,
      sub: `${kpis.totalTasks - kpis.completedTasks} not yet completed`,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => (
        <Card key={c.label} className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-2">
            <div className={`h-8 w-8 rounded-lg ${c.bg} flex items-center justify-center`}>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-xs font-medium text-muted-foreground leading-tight">{c.label}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">{c.sub}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
