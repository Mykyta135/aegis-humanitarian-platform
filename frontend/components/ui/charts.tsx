"use client";

import * as React from "react";
import {
  Area,
  Bar,
  Line,
  Pie,
  RadialBar,
  type AreaProps,
  type BarProps,
  type LineProps,
  type PieProps,
  type RadialBarProps,
  // These are the only components we need directly from recharts
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { cn } from "@/lib/utils";
import {
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart-tooltip"; // <-- CORRECT IMPORT

// --- ChartContainer and ChartStyle can be included here directly ---
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: any;
  }
>(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex aspect-video h-full w-full items-center justify-center",
        className
      )}
      {...props}
    >
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  );
});
ChartContainer.displayName = "ChartContainer";

const ChartStyle = ({ id, config }: { id: string; config: any }) => {
  // This is a placeholder for more advanced styling in the future.
  return null;
};

// --- The rest of the file remains the same ---
// (ChartContext, useChart, and the main Chart component)
const ChartContext = React.createContext<any>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <Chart />");
  }
  return context;
}

const Chart = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & React.ComponentProps<typeof ChartContainer>
>(({ config, ...props }, ref) => {
  const id = React.useId();
  const uniqueId = React.useMemo(() => `chart-${id}`, [id]);

  return (
    <ChartContext.Provider value={{ id: uniqueId, config, ...props }}>
      <ChartStyle id={uniqueId} config={config} />
      <ChartContainer ref={ref} id={uniqueId} config={config} {...props} />
    </ChartContext.Provider>
  );
});
Chart.displayName = "Chart";

// Final exports
export {
  Chart,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  useChart,
  Area,
  Bar,
  Line,
  Pie,
  RadialBar,
};
export type { AreaProps, BarProps, LineProps, PieProps, RadialBarProps };
