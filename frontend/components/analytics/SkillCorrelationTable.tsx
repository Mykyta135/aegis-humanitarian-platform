"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type SkillMissionCorrelation } from "@/hooks/use-analytics-data";

interface Props {
  data: SkillMissionCorrelation[] | undefined;
}

export function SkillCorrelationTable({ data }: Props) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.avgMissionsPerVolunteer), 0.01);

  const impactLabel = (avg: number): { label: string; variant: "default" | "secondary" | "outline" } => {
    if (avg >= max * 0.75) return { label: "High impact", variant: "default" };
    if (avg >= max * 0.4) return { label: "Medium", variant: "secondary" };
    return { label: "Low", variant: "outline" };
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Skill → Mission Correlation</CardTitle>
        <CardDescription>
          Average completed missions per volunteer, grouped by skill. Higher = more mission-active volunteers with this skill.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((row) => {
            const { label, variant } = impactLabel(row.avgMissionsPerVolunteer);
            return (
              <div key={row.skill} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{row.skill}</span>
                    <Badge variant={variant} className="text-[10px] h-4 px-1.5">{label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{row.volunteers} volunteers</span>
                    <span className="font-medium text-foreground">
                      {row.avgMissionsPerVolunteer.toFixed(1)}× avg
                    </span>
                  </div>
                </div>
                <Progress value={(row.avgMissionsPerVolunteer / max) * 100} className="h-1.5" />
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-4">
          Insight: Skills with high averages suggest that volunteers with these skills are assigned to more missions on average — useful for recruitment prioritization.
        </p>
      </CardContent>
    </Card>
  );
}
