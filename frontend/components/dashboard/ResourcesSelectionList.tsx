"use client";

import { useResources } from "@/hooks/use-resources";
import { useTaskFormStore } from "@/stores/use-task-form.store";
import { useFilterStore } from "@/stores/use-filter.store"; // We can still use our filters here
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "./EmptyState";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResourcesFilter } from "./ResourcesFilter"; // Reuse the filter component

export function ResourceSelectionList() {
  const { filters } = useFilterStore();
  const {
    data: resources,
    isLoading,
    isError,
  } = useResources(filters.resources);
  const { resourceIds, toggleResource } = useTaskFormStore();

  if (isError) {
    return (
      <div className="p-4 border rounded-lg">
        <h4 className="font-bold mb-2 text-destructive">Error</h4>
        <p>Failed to load resources.</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold">Select Required Resources</h4>
        <ResourcesFilter />
      </div>

      <ScrollArea className="h-[250px]">
        <div className="pr-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <>
              {!resources || resources.length === 0 ? (
                <EmptyState
                  title="No resources found"
                  description="Try adjusting your filters."
                />
              ) : (
                <div className="space-y-2">
                  {resources.map((resource) => {
                    const isAvailable = resource.status === "available";
                    const isSelected = resourceIds.includes(resource.id);
                    return (
                      <Button
                        key={resource.id}
                        onClick={() => toggleResource(resource.id)}
                        disabled={!isAvailable}
                        variant={isSelected ? "default" : "outline"}
                        className="w-full justify-between text-left h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div>
                          <p className="font-semibold">{resource.name}</p>
                          <p className="text-xs font-normal text-muted-foreground">
                            {resource.type}
                          </p>
                        </div>
                        <Badge
                          variant={isAvailable ? "default" : "secondary"}
                          className={isAvailable ? "bg-green-500" : ""}
                        >
                          {resource.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
