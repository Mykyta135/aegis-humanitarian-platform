"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useRouteAlternatives,
  type RouteAlternative,
} from "@/hooks/use-route-alternatives";
import {
  Car,
  Bike,
  Footprints,
  Clock,
  Route,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

interface Props {
  taskId: string;
  hasLocations: boolean;
  onSelectRoute?: (alt: RouteAlternative) => void;
}

const PROFILE_ICONS: Record<string, React.ElementType> = {
  "driving-car": Car,
  "cycling-road": Bike,
  "foot-walking": Footprints,
};

function safetyColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

function safetyBg(score: number): string {
  if (score >= 80) return "bg-green-50 border-green-200";
  if (score >= 50) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

function safetyLabel(score: number): string {
  if (score >= 90) return "Very Safe";
  if (score >= 70) return "Safe";
  if (score >= 50) return "Moderate Risk";
  if (score >= 30) return "High Risk";
  return "Dangerous";
}

export function RouteAlternativesPanel({ taskId, hasLocations, onSelectRoute }: Props) {
  const { data: alternatives, isLoading } = useRouteAlternatives(taskId, hasLocations);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!hasLocations) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Route className="h-4 w-4" />
          Route Alternatives
          <span className="text-xs font-normal text-muted-foreground ml-1">
            (scored against active threat zones)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}
        {!isLoading && (!alternatives || alternatives.length === 0) && (
          <p className="text-sm text-muted-foreground py-2">
            No route alternatives available for this mission.
          </p>
        )}
        {alternatives && alternatives.length > 0 && (
          <div className="space-y-2">
            {alternatives.map((alt) => {
              const ProfileIcon = PROFILE_ICONS[alt.profile] ?? Car;
              const isSelected = selectedId === alt.id;

              return (
                <button
                  key={alt.id}
                  onClick={() => {
                    setSelectedId(alt.id);
                    onSelectRoute?.(alt);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : alt.recommended
                      ? "border-green-300 bg-green-50/50"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      <ProfileIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{alt.label}</p>
                        {alt.recommended && (
                          <Badge variant="default" className="text-[10px] h-4 px-1.5 bg-green-600">
                            <Star className="h-2.5 w-2.5 mr-0.5" />
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Route className="h-3 w-3" />
                          {alt.distanceKm} km
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {alt.durationMin < 60
                            ? `${alt.durationMin} min`
                            : `${Math.floor(alt.durationMin / 60)}h ${alt.durationMin % 60}m`}
                        </span>
                      </div>
                    </div>
                    <div className={`shrink-0 text-right ${safetyColor(alt.safetyScore)}`}>
                      <div className="flex items-center gap-1">
                        {alt.safetyScore >= 70 ? (
                          <ShieldCheck className="h-4 w-4" />
                        ) : alt.safetyScore >= 40 ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          <ShieldAlert className="h-4 w-4" />
                        )}
                        <span className="text-lg font-bold">{alt.safetyScore}</span>
                      </div>
                      <p className="text-[10px]">{safetyLabel(alt.safetyScore)}</p>
                    </div>
                  </div>

                  {/* Threat exposure */}
                  {alt.threatExposure.length > 0 && (
                    <div className={`mt-2 rounded px-2 py-1.5 border ${safetyBg(alt.safetyScore)}`}>
                      <p className="text-[10px] font-medium flex items-center gap-1 mb-1">
                        <AlertTriangle className="h-3 w-3" />
                        Passes through {alt.threatExposure.length} threat zone(s):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {alt.threatExposure.map((t, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className={`text-[9px] h-4 px-1 ${
                              t.severity === "critical"
                                ? "border-red-400 text-red-700"
                                : t.severity === "high"
                                ? "border-orange-400 text-orange-700"
                                : "border-yellow-400 text-yellow-700"
                            }`}
                          >
                            {t.zoneName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
