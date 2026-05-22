"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
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
import { PlaceholderChart } from "./PlaceholderChart";

const chartConfig = {
  count: { label: "Count", color: "hsl(var(--chart-1))" },
};

export function SkillDistributionChart({ data }: { data: any }) {
  if (!data) {
    return <PlaceholderChart title="Skill Distribution" />;
  }

  // Future data structure: [{ skill: "medic", count: 10 }, { skill: "driver", count: 8 }]
  const chartData = data;

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>Skill Distribution</CardTitle>
        <CardDescription>
          Breakdown of available skills across all personnel.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarGrid gridType="circle" />
            <PolarAngleAxis dataKey="skill" />
            <Radar
              dataKey="count"
              fill="var(--color-count)"
              fillOpacity={0.6}
              dot={{ r: 4, fillOpacity: 1 }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
