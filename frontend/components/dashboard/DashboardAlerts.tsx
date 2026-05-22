"use client";

import { useDashboardInsights } from "@/hooks/use-dashboard-insights";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ShieldX } from "lucide-react"; // Import icons

export function DashboardAlerts() {
  const { data: alerts, isLoading, isError } = useDashboardInsights();

  if (isLoading || isError || !alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert, index) => (
        <Alert
          key={index}
          variant={alert.type === "critical" ? "destructive" : "default"}
        >
          {alert.type === "critical" ? (
            <ShieldX className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle className="font-semibold">
            {alert.type === "critical" ? "Critical Alert" : "Warning"}
          </AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
