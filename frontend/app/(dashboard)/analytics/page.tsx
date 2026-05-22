"use client";

import { useAnalyticsData } from "@/hooks/use-analytics-data";
import { useResources } from "@/hooks/use-resources";

// UI Components
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Analytics Components
import { ActiveVolunteersChart } from "@/components/analytics/ActiveVolunteersChart";
import { ActivityHeatmap } from "@/components/analytics/ActivityHeatmap";
import { DurationComparisonChart } from "@/components/analytics/DurationComparisonChart";
import { InsightsPanel } from "@/components/analytics/InsightsPanel";
import { KpiCards } from "@/components/analytics/KpiCards";
import { PriorityBreakdownChart } from "@/components/analytics/PriorityBreakdownChart";
import { ResourceConditionChart } from "@/components/analytics/ResourceConditionChart";
import { SkillCorrelationTable } from "@/components/analytics/SkillCorrelationTable";
import { SkillDistributionChart } from "@/components/analytics/SkillDistributionChart";
import { StatusBreakdownChart } from "@/components/analytics/StatusBreakdownChart";
import { SuccessRateByRegionChart } from "@/components/analytics/SuccessRateByRegionChart";

export default function AnalyticsPage() {
  const {
    data: analyticsData,
    isLoading: isLoadingAnalytics,
    isError: isErrorAnalytics,
  } = useAnalyticsData();

  const {
    data: resources,
    isLoading: isLoadingResources,
    isError: isErrorResources,
  } = useResources({});

  const isLoading = isLoadingAnalytics || isLoadingResources;
  const isError = isErrorAnalytics || isErrorResources;

  // Render a loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        <div className="space-y-1">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        {/* KPI Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Separator />
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
            </div>
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Render an error state if either API call fails
  if (isError) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Data
            </CardTitle>
            <CardDescription>
              Could not fetch analytics data. Please check your connection and try refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Render the full dashboard once data is available
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Analytics Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Real-time operational intelligence, resource allocation, and personnel insights.
        </p>
      </div>

      {/* Top Level KPIs */}
      <KpiCards kpis={analyticsData?.kpis} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Column: Tabbed Data (Takes up 3/4 width on huge screens) */}
        <div className="xl:col-span-3 space-y-6">
          <Tabs defaultValue="missions" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-11">
              <TabsTrigger value="missions">Missions & Operations</TabsTrigger>
              <TabsTrigger value="personnel">Personnel Analysis</TabsTrigger>
              <TabsTrigger value="resources">Resources & Logistics</TabsTrigger>
            </TabsList>

            {/* Missions Dashboard */}
            <TabsContent value="missions" className="mt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <StatusBreakdownChart data={analyticsData?.statusBreakdown} />
                <PriorityBreakdownChart data={analyticsData?.priorityBreakdown} />
              </div>
              
              <ActivityHeatmap data={analyticsData?.missionsByDayOfWeek} />
              
              <div className="grid gap-6 md:grid-cols-2">
                <DurationComparisonChart data={analyticsData?.durationComparison} />
                <SuccessRateByRegionChart data={analyticsData?.missionSuccessByRegion} />
              </div>
            </TabsContent>

            {/* Personnel Dashboard */}
            <TabsContent value="personnel" className="mt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <ActiveVolunteersChart data={analyticsData?.activeVolunteers} />
                <SkillDistributionChart data={analyticsData?.skillDistribution} />
              </div>
              <SkillCorrelationTable data={analyticsData?.skillMissionCorrelation} />
            </TabsContent>

            {/* Resources Dashboard */}
            <TabsContent value="resources" className="mt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <ResourceConditionChart data={resources} />
                {/* 
                  Add future resource-specific charts here (e.g. Resource Utilization Trends) 
                  For now, it cleanly displays current resource conditions.
                */}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Persistent Sidebar (Insights & Alerts) */}
        <div className="xl:col-span-1 space-y-6">
          <InsightsPanel />
        </div>
        
      </div>
    </div>
  );
}