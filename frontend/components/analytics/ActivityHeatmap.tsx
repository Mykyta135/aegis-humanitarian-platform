"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const REGIONS = ["kharkiv", "donetsk", "zaporizhzhia", "kherson", "luhansk", "kyiv"];

interface HeatmapRow {
  dow: number;
  region: string;
  count: string;
}

interface ActivityHeatmapProps {
  data: HeatmapRow[] | undefined;
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  if (!data || data.length === 0) return null;

  // Build matrix: region × dow → count
  const matrix: Record<string, Record<number, number>> = {};
  let maxVal = 0;
  for (const row of data) {
    if (!matrix[row.region]) matrix[row.region] = {};
    const v = Number(row.count);
    matrix[row.region][row.dow] = v;
    if (v > maxVal) maxVal = v;
  }

  const presentRegions = REGIONS.filter((r) => matrix[r]);

  const cellColor = (val: number): string => {
    if (!val || maxVal === 0) return "bg-muted/30";
    const ratio = val / maxVal;
    if (ratio < 0.2) return "bg-blue-100 dark:bg-blue-950";
    if (ratio < 0.4) return "bg-blue-200 dark:bg-blue-900";
    if (ratio < 0.6) return "bg-blue-300 dark:bg-blue-800";
    if (ratio < 0.8) return "bg-blue-400 dark:bg-blue-700";
    return "bg-blue-600 dark:bg-blue-500";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Mission Activity Heatmap</CardTitle>
        <CardDescription>Missions created per region per day of week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="text-left text-muted-foreground font-normal pr-2 w-24">Region</th>
                {DAYS.map((d) => (
                  <th key={d} className="text-center text-muted-foreground font-normal">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {presentRegions.map((region) => (
                <tr key={region}>
                  <td className="capitalize text-muted-foreground pr-2 py-0.5">{region}</td>
                  {Array.from({ length: 7 }, (_, i) => {
                    const val = matrix[region]?.[i] ?? 0;
                    return (
                      <td key={i} className="text-center py-0.5">
                        <div
                          className={`h-7 w-7 mx-auto rounded flex items-center justify-center font-medium transition-colors ${cellColor(val)}`}
                          title={`${region} ${DAYS[i]}: ${val} missions`}
                        >
                          {val > 0 ? val : ""}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
          <span>Low</span>
          {["bg-muted/30", "bg-blue-100", "bg-blue-200", "bg-blue-300", "bg-blue-400", "bg-blue-600"].map((c, i) => (
            <div key={i} className={`h-3 w-5 rounded ${c}`} />
          ))}
          <span>High</span>
        </div>
      </CardContent>
    </Card>
  );
}
