"use client";

import { useAuthStore } from "@/stores/use-auth.store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskFormColumn } from "@/components/dashboard/TaskFormColumn";
import { TasksDataTable } from "@/components/dashboard/TasksDataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateResourceForm } from "@/components/dashboard/CreateResourceForm";
import { CreateVolunteerForm } from "@/components/dashboard/CreateVolounteerForm";
import { useTasks } from "@/hooks/use-tasks";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: tasks, isLoading } = useTasks({});

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Aegis Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Coordinate missions, manage assets, and view operational status.
        </p>
      </div>

      <Tabs defaultValue="mission-log" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mission-log">Mission Log</TabsTrigger>
          <TabsTrigger value="request-mission">Request a Mission</TabsTrigger>
          <TabsTrigger value="manage-assets">Manage Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="mission-log" className="mt-6">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <TasksDataTable data={tasks ?? []} />
          )}
        </TabsContent>

        <TabsContent value="request-mission" className="mt-6">
          <div className="max-w-3xl mx-auto">
            <TaskFormColumn />
          </div>
        </TabsContent>

        <TabsContent value="manage-assets" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <CreateResourceForm />
            {user?.role === "admin" && <CreateVolunteerForm />}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
