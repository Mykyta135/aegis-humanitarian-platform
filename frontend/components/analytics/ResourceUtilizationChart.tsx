// "use client";

// import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   ChartContainer,
//   ChartTooltip,
//   ChartTooltipContent,
//   ChartLegend,
//   ChartLegendContent,
// } from "@/components/ui/charts";
// import { AnalyticsData } from "@/hooks/use-analytics-data";

// type Props = {
//   data: AnalyticsData["resourceUtilization"] | undefined;
// };

// const chartConfig = {
//   inUse: { label: "In Use", color: "hsl(var(--chart-2))" },
//   available: { label: "Available", color: "hsl(var(--chart-1))" },
// };
// export function ResourceUtilizationChart({ data }: Props) {
//   const chartData = data?.map((item) => ({
//     type: item.type.charAt(0).toUpperCase() + item.type.slice(1),
//     inUse: Number(item.inUseCount),
//     available: Number(item.availableCount),
//   }));

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Resource Utilization</CardTitle>
//         <CardDescription>Current status of all resource types.</CardDescription>
//       </CardHeader>
//       <CardContent>
//         <ChartContainer config={chartConfig}>
//           <BarChart accessibilityLayer data={chartData} margin={{ left: 12 }}>
//             <CartesianGrid vertical={false} />
//             <XAxis
//               dataKey="type"
//               tickLine={false}
//               axisLine={false}
//               tickMargin={8}
//               tickFormatter={(value) => value.slice(0, 3)}
//             />
//             <ChartTooltip content={<ChartTooltipContent />} />
//             <ChartLegend content={<ChartLegendContent />} />
//             <Bar
//               dataKey="inUse"
//               fill="var(--color-inUse)"
//               stackId="a"
//               radius={[0, 0, 4, 4]}
//             />
//             <Bar
//               dataKey="available"
//               fill="var(--color-available)"
//               stackId="a"
//               radius={[4, 4, 0, 0]}
//             />
//           </BarChart>
//         </ChartContainer>
//       </CardContent>
//     </Card>
//   );
// }
