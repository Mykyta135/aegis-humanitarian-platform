"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useVolunteers } from "@/hooks/use-volunteers";
import { useFilterStore } from "@/stores/use-filter.store";
import { useTaskFormStore } from "@/stores/use-task-form.store";
import { Info } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "./EmptyState";
import { VolunteersFilter } from "./VolunteersFilter";
import { cn } from "@/lib/utils";

export function VolunteersColumn() {
  const { filters } = useFilterStore();
  const {
    data: volunteers,
    isLoading,
    isError,
  } = useVolunteers(filters.volunteers);
  const { assigneeId, setAssignee } = useTaskFormStore();

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to load volunteers.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Volunteers</CardTitle>
        <VolunteersFilter />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[450px]">
          <div className="pr-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                {!volunteers || volunteers.length === 0 ? (
                  <EmptyState
                    title="No volunteers found"
                    description="Try adjusting your filters."
                  />
                ) : (
                  <div className="space-y-2">
                    {volunteers.map((volunteer) => {
                      const isAvailable = volunteer.status === "available";
                      const isSelected = assigneeId === volunteer.id;
                      return (
                        <div
                          key={volunteer.id}
                          className="flex items-center gap-2 pr-4"
                        >
                          <Button
                            onClick={() => setAssignee(volunteer.id)}
                            disabled={!isAvailable}
                            variant={isSelected ? "default" : "outline"}
                            className="flex-1 justify-between text-left h-auto max-w-full disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div>
                              <p className="font-semibold">{volunteer.name}</p>
                              <p className="text-xs font-normal text-muted-foreground">
                                {volunteer.skills.join(", ")}
                              </p>
                            </div>
                            <Badge
                              variant={isAvailable ? "default" : "secondary"}
                              className={cn(isAvailable ? "bg-green-500" : "", "mr-4")}
                            >
                              {volunteer.status.replace("_", " ").toUpperCase()}
                            </Badge>
                          </Button>

                          <Link href={`/volunteers/${volunteer.id}`} className={cn("shrink-0 -ml-10  p-2", { "text-white": isSelected })} passHref>
                            <button
                            className="hover:cursor-pointer"
                              aria-label={`View details for ${volunteer.name}`}
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
