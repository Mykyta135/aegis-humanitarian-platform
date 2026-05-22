"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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

const chartConfig = {
  estimated: { label: "Estimated", color: "hsl(var(--chart-1))" },
  actual: { label: "Actual", color: "hsl(var(--chart-2))" },
};

export function DurationComparisonChart({ data }: { data: any[] | undefined }) {
  const chartData =
    data?.map((item) => ({
      difficulty: item.difficulty,
      estimated: parseFloat(item.avgEstimatedHours).toFixed(1),
      actual: parseFloat(item.avgActualHours).toFixed(1),
    })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mission Duration: Estimated vs. Actual</CardTitle>
        <CardDescription>
          Average duration in hours, grouped by mission difficulty.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="difficulty"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis unit="h" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="estimated" fill="var(--color-estimated)" radius={4} />
            <Bar dataKey="actual" fill="var(--color-actual)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
