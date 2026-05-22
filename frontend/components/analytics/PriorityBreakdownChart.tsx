"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/charts";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface Props {
  data: { priority: string; count: string; completed: string }[] | undefined;
}

const PRIORITY_ORDER = ["low", "medium", "high", "critical"];
const COLORS: Record<string, string> = {
  low: "hsl(var(--chart-1))",
  medium: "hsl(var(--chart-2))",
  high: "hsl(var(--chart-3))",
  critical: "hsl(var(--chart-4))",
};

const chartConfig = {
  total: { label: "Total" },
  completed: { label: "Completed" },
};

export function PriorityBreakdownChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  const sorted = [...data].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
  );

  const chartData = sorted.map((d) => ({
    priority: d.priority.charAt(0).toUpperCase() + d.priority.slice(1),
    total: Number(d.count),
    completed: Number(d.completed),
    pending: Number(d.count) - Number(d.completed),
    fill: COLORS[d.priority] ?? "hsl(var(--chart-1))",
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Missions by Priority</CardTitle>
        <CardDescription>Total vs. completed for each priority level</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
            <XAxis dataKey="priority" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]} fill="hsl(var(--muted))" />
            <Bar dataKey="completed" name="Completed" radius={[4, 4, 0, 0]} fill="hsl(var(--chart-3))" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
