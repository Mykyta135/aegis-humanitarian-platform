"use client";

import { Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/charts";

// This data will eventually come from the backend
const getConditionData = (resources: any[] | undefined) => {
  if (!resources) return [];
  const counts = resources.reduce((acc, resource) => {
    acc[resource.condition] = (acc[resource.condition] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts).map(([condition, count]) => ({
    condition,
    count,
    fill: `var(--color-${condition})`,
  }));
};

const chartConfig = {
  count: { label: "Count" },
  excellent: { label: "Excellent", color: "hsl(var(--chart-1))" },
  good: { label: "Good", color: "hsl(var(--chart-2))" },
  needs_maintenance: {
    label: "Needs Maintenance",
    color: "hsl(var(--chart-3))",
  },
  inoperable: { label: "Inoperable", color: "hsl(var(--chart-4))" },
};

// We'll pass the raw resources data to this chart for client-side aggregation
export function ResourceConditionChart({ data }: { data: any[] | undefined }) {
  const chartData = getConditionData(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Condition Breakdown</CardTitle>
        <CardDescription>Overall readiness of all assets.</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="condition"
              innerRadius={50}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
