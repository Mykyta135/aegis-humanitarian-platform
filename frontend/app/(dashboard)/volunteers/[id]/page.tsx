"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MissionHistoryTable } from "@/components/volunteers/MissionHistoryTable";
import { useVolunteer } from "@/hooks/use-volunteer";
import { useVolunteerTasks } from "@/hooks/use-volunteer-tasks";
import { useParams } from "next/navigation";

export default function VolunteerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: volunteer, isLoading, isError } = useVolunteer(id);
  const { data: tasks, isLoading: isLoadingTasks } = useVolunteerTasks(id);
  if (isLoading || isLoadingTasks) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !volunteer) {
    return (
      <div className="container mx-auto p-8">Error loading volunteer data.</div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {volunteer.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Volunteer Digital Dossier
        </p>
      </div>

      <Separator />

      {/* Grid for details */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Status & Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Status:</span>{" "}
              <Badge>{volunteer.status.toUpperCase()}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Experience:</span> <span>{volunteer.experienceLevel}</span>
            </div>
            <div className="flex justify-between">
              <span>Home Base:</span>{" "}
              <span>
                {volunteer.homeBase
                  ? `${volunteer.homeBase.lat.toFixed(4)}, ${volunteer.homeBase.lng.toFixed(4)}`
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills & Languages</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-2">
            <div>
              <h4 className="font-semibold mb-1">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {volunteer.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-1">Languages</h4>
              <div className="flex flex-wrap gap-2">
                {volunteer.languages!.map((lang) => (
                  <Badge key={lang} variant="outline">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Coordinator Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {volunteer.notes || "No notes available."}
            </p>
          </CardContent>
        </Card>

        {isLoadingTasks ? (
          <Skeleton className="h-48 w-full lg:col-span-3" />
        ) : (
          tasks && <MissionHistoryTable tasks={tasks} />
        )}
      </div>
    </div>
  );
}
