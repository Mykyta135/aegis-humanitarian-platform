// "use client"

// import * as React from "react"
// import { ContentType, Formatter, Legend, LegendProps } from "recharts"

// import { cn } from "@/lib/utils"

// const ChartLegend = React.forwardRef<
//   React.ComponentRef<typeof Legend>,
//   React.ComponentProps<typeof Legend> & {
//     hide?: boolean
//   }
// >(({ className, hide = false, ...props }, ref) => {
//   if (hide) {
//     return null
//   }

//   return (
//     <Legend
//       ref={ref}
//       verticalAlign="bottom"
//       wrapperStyle={{
//         paddingTop: "20px",
//       }}
//       className={cn(
//         "flex flex-wrap items-center justify-center gap-x-4 gap-y-2 [&_.recharts-legend-item]:flex [&_.recharts-legend-item]:items-center [&_.recharts-legend-item]:gap-2 [&_.recharts-legend-icon]:!h-3 [&_.recharts-legend-icon]:!w-3 [&_.recharts-legend-item-text]:!text-xs [&_.recharts-legend-item-text]:!text-muted-foreground",
//         className
//       )}
//       {...props}
//     />
//   )
// })
// ChartLegend.displayName = "ChartLegend"

// const ChartLegendContent = React.forwardRef<
//   HTMLDivElement,
//   React.ComponentProps<"div"> &
//     Pick<LegendProps, "payload" | "formatter"> & {
//       hide?: boolean
//       name: string
//     }
// >(({ className, hide = false, payload, formatter, name }, ref) => {
//   if (hide || !payload || !payload.length) {
//     return null
//   }

//   return (
//     <div
//       ref={ref}
//       className={cn("flex items-center justify-between gap-4", className)}
//     >
//       <p className="font-medium">{name}</p>
//       <div className="flex items-center gap-4">
//         {payload.map((item) => {
//           const { dataKey, color, value } = item
//           const formattedValue =
//             formatter?.(value as any, item, payload.indexOf(item)) ?? value

//           return (
//             <div key={dataKey as string} className="flex items-center gap-2 text-xs">
//               <div
//                 className="h-3 w-3 shrink-0 rounded-[2px]"
//                 style={{
//                   backgroundColor: color,
//                 }}
//               />
//               <div className="flex-1 space-y-1">
//                 <p className="text-muted-foreground">{formattedValue as React.ReactNode}</p>
//               </div>
//             </div>
//           )
//         })}
//       </div>
//     </div>
//   )
// })
// ChartLegendContent.displayName = "ChartLegendContent"

// export { ChartLegend, ChartLegendContent }