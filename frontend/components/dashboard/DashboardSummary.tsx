"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useResources } from "@/hooks/use-resources";
import { useTasks } from "@/hooks/use-tasks";
import { useVolunteers } from "@/hooks/use-volunteers";

export function DashboardSummary() {
  const { data: volunteers, isLoading: isLoadingVolunteers } = useVolunteers(
    {}
  );
  const { data: resources, isLoading: isLoadingResources } = useResources({});
  const { data: tasks, isLoading: isLoadingTasks } = useTasks({});

  const isLoading = isLoadingVolunteers || isLoadingResources || isLoadingTasks;

  // 2. Perform calculations on the data
  const totalVolunteers = volunteers?.length || 0;
  const availableVolunteers =
    volunteers?.filter((v) => v.status === "available").length || 0;

  const totalResources = resources?.length || 0;
  const availableResources =
    resources?.filter((r) => r.status === "available").length || 0;

  const activeTasks =
    tasks?.filter((t) => t.status === "pending" || t.status === "in_progress")
      .length || 0;

  // 3. Render the summary cards
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Available Volunteers
          </CardTitle>
          {/* You can add an icon here later e.g., <Users className="h-4 w-4 text-muted-foreground" /> */}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {availableVolunteers} / {totalVolunteers}
          </div>
          <p className="text-xs text-muted-foreground">
            {totalVolunteers - availableVolunteers} currently on mission
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Available Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {availableResources} / {totalResources}
          </div>
          <p className="text-xs text-muted-foreground">
            {totalResources - availableResources} currently in use
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Missions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeTasks}</div>
          <p className="text-xs text-muted-foreground">
            Tasks currently pending or in progress
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
