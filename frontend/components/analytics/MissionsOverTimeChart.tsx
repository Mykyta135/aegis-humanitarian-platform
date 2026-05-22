// "use client";

// import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
// import { format, parseISO } from "date-fns";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   ChartContainer,
//   ChartLegend,
//   ChartLegendContent,
//   ChartTooltip,
//   ChartTooltipContent,
// } from "@/components/ui/charts";
// import { AnalyticsData } from "@/hooks/use-analytics-data";

// type Props = {
//   data: AnalyticsData["tasksOverTime"] | undefined;
// };

// const chartConfig = {
//   created: {
//     label: "Created",
//     color: "hsl(var(--chart-2))",
//   },
//   completed: {
//     label: "Completed",
//     color: "hsl(var(--chart-1))",
//   },
// }

// export function MissionsOverTimeChart({ data }: Props) {
//   const chartData = data?.map((item) => ({
//     date: item.date,
//     created: Number(item.created),
//     completed: Number(item.completed),
//   }));

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Missions: Last 30 Days</CardTitle>
//         <CardDescription>
//           Trend of tasks created versus tasks completed daily.
//         </CardDescription>
//       </CardHeader>
//       <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
//         <ChartContainer
//           config={chartConfig}
//           className="aspect-auto h-[250px] w-full"
//         >
//           <AreaChart data={chartData}>
//             <defs>
//               <linearGradient id="fillCreated" x1="0" y1="0" x2="0" y2="1">
//                 <stop
//                   offset="5%"
//                   stopColor="var(--color-created)"
//                   stopOpacity={0.8}
//                 />
//                 <stop
//                   offset="95%"
//                   stopColor="var(--color-created)"
//                   stopOpacity={0.1}
//                 />
//               </linearGradient>
//               <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
//                 <stop
//                   offset="5%"
//                   stopColor="var(--color-completed)"
//                   stopOpacity={0.8}
//                 />
//                 <stop
//                   offset="95%"
//                   stopColor="var(--color-completed)"
//                   stopOpacity={0.1}
//                 />
//               </linearGradient>
//             </defs>
//             <CartesianGrid vertical={false} />
//             <XAxis
//               dataKey="date"
//               tickLine={false}
//               axisLine={false}
//               tickMargin={8}
//               minTickGap={32}
//               tickFormatter={(value) => format(parseISO(value), "MMM d")}
//             />
//             <ChartTooltip
//               cursor={false}
//               content={
//                 <ChartTooltipContent
//                   labelFormatter={(value: any) =>
//                     format(parseISO(value), "EEEE, MMM d")
//                   }
//                   indicator="dot"
//                 />
//               }
//             />
//             <Area
//               dataKey="completed"
//               type="natural"
//               fill="url(#fillCompleted)"
//               stroke="var(--color-completed)"
//               stackId="a"
//             />
//             <Area
//               dataKey="created"
//               type="natural"
//               fill="url(#fillCreated)"
//               stroke="var(--color-created)"
//               stackId="a"
//             />
//             <ChartLegend content={<ChartLegendContent />} />
//           </AreaChart>
//         </ChartContainer>
//       </CardContent>
//     </Card>
//   );
// }
