"use client";

import { VolunteerTask } from "@/hooks/use-volunteer-tasks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface MissionHistoryTableProps {
  tasks: VolunteerTask[];
}

export function MissionHistoryTable({ tasks }: MissionHistoryTableProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600 text-white";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      case "in_progress":
        return "bg-blue-500 text-white";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Mission History</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This volunteer has not been assigned to any missions yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mission Title</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>{task.region}</TableCell>
                  <TableCell>{task.priority.toUpperCase()}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={cn(getStatusVariant(task.status))}>
                      {task.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
