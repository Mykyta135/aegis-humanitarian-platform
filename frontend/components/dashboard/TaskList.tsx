"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/hooks/use-tasks";
import { useUpdateTaskStatus } from "@/hooks/use-update-task-status";
import { format } from "date-fns";
import { Clock, MapPin, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "./EmptyState";

type ConfirmationAction = {
  taskId: string;
  newStatus: "completed" | "cancelled";
  title: string;
};

export function TaskList() {
  const { data: tasks, isLoading, isError } = useTasks({});
  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateTaskStatus();
  const [actionToConfirm, setActionToConfirm] =
    useState<ConfirmationAction | null>(null);

  const handleConfirmAction = () => {
    if (actionToConfirm) {
      updateStatus({
        id: actionToConfirm.taskId,
        status: actionToConfirm.newStatus,
      });
      setActionToConfirm(null);
    }
  };

  return (
    <>
      <AlertDialog
        open={!!actionToConfirm}
        onOpenChange={() => setActionToConfirm(null)}
      >
        <Card>
          <CardHeader>
            <CardTitle>Mission Log</CardTitle>
            <CardDescription>
              A list of all ongoing, pending, and completed missions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="pr-4">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : isError ? (
                  <EmptyState
                    title="Error"
                    description="Failed to load tasks."
                  />
                ) : !tasks || tasks.length === 0 ? (
                  <EmptyState
                    title="No tasks found"
                    description="Create a new task to get started."
                  />
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task) => {
                      const canBeManaged =
                        task.status === "pending" ||
                        task.status === "in_progress";
                      const getBadgeVariant = () => {
                        switch (task.status) {
                          case "completed":
                            return "default";
                          case "cancelled":
                            return "destructive";
                          default:
                            return "secondary";
                        }
                      };

                      return (
                        <Card key={task.id}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg pr-4">
                                  {task.title}
                                </CardTitle>
                                <CardDescription className="pt-1">
                                  {task.description}
                                </CardDescription>
                              </div>
                              {canBeManaged && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-8 w-8 p-0 flex-shrink-0"
                                    >
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setActionToConfirm({
                                          taskId: task.id,
                                          newStatus: "completed",
                                          title: task.title,
                                        })
                                      }
                                      disabled={isUpdatingStatus}
                                    >
                                      Mark as Completed
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setActionToConfirm({
                                          taskId: task.id,
                                          newStatus: "cancelled",
                                          title: task.title,
                                        })
                                      }
                                      disabled={isUpdatingStatus}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      Cancel Task
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm font-medium">
                              Assignee:{" "}
                              <span className="text-muted-foreground">
                                {task.assignee?.name ?? "Unassigned"}
                              </span>
                            </p>
                            <p className="text-sm font-medium">
                              Resources:{" "}
                              <span className="text-muted-foreground">
                                {task.resources.map((r) => r.name).join(", ")}
                              </span>
                            </p>
                          </CardContent>
                          <CardFooter className="flex justify-between items-center text-xs text-muted-foreground pt-4 border-t">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" />
                              <span>
                                {task.region.charAt(0).toUpperCase() +
                                  task.region.slice(1)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />
                              <span>
                                Created:{" "}
                                {format(
                                  new Date(task.createdAt),
                                  "MMM d, yyyy 'at' h:mm a",
                                )}
                              </span>
                            </div>
                            <Badge
                              variant={getBadgeVariant()}
                              className={
                                task.status === "completed"
                                  ? "bg-green-600"
                                  : ""
                              }
                            >
                              {task.status.replace("_", " ").toUpperCase()}
                            </Badge>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark the task "{actionToConfirm?.title}" as{" "}
              {actionToConfirm?.newStatus?.toUpperCase()} and release all
              assigned personnel and resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
