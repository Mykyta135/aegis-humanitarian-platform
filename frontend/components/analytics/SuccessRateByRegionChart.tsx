"use client"

import { PolarGrid, RadialBar, RadialBarChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/charts"
import { PlaceholderChart } from "./PlaceholderChart"

const chartConfig = {
  rate: { label: "Success Rate" },
  kharkiv: { label: "Kharkiv", color: "hsl(var(--chart-1))" },
  donetsk: { label: "Donetsk", color: "hsl(var(--chart-2))" },
  luhansk: { label: "Luhansk", color: "hsl(var(--chart-3))" },
  zaporizhzhia: { label: "Zaporizhzhia", color: "hsl(var(--chart-4))" },
  lviv: { label: "Lviv", color: "hsl(var(--chart-5))" },
  odessa: { label: "Odessa", color: "hsl(var(--chart-6))" },

}

export function SuccessRateByRegionChart({ data }: { data: any }) {
  if (!data) {
    return <PlaceholderChart title="Mission Success Rate by Region" />
  }

  const chartData = data;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Success Rate by Region</CardTitle>
        <CardDescription>Based on completed vs. cancelled missions.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <RadialBarChart data={chartData} innerRadius={30} outerRadius={100}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="region" />} />
            <PolarGrid gridType="circle" />
            <RadialBar dataKey="rate" />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}