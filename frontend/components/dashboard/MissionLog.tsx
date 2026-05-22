"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddTaskLog } from "@/hooks/use-task-logs";
import { useAuthStore } from "@/stores/use-auth.store";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Clock, PlusCircle } from "lucide-react";
import { useState } from "react";

export interface LogEntry {
  timestamp: string;
  message: string;
  author?: string;
}

interface MissionLogProps {
  taskId: string;
  logs: LogEntry[];
  taskCreatedAt: string;
  taskStatus: string;
}

export function MissionLog({ taskId, logs, taskCreatedAt, taskStatus }: MissionLogProps) {
  const [newEntry, setNewEntry] = useState("");
  const user = useAuthStore((s) => s.user);
  const { mutate: addLog, isPending } = useAddTaskLog(taskId);

  // Build a synthetic timeline: creation event + all log entries
  const timeline: LogEntry[] = [
    { timestamp: taskCreatedAt, message: "Mission created", author: "System" },
    ...logs,
  ];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim()) return;
    addLog({ message: newEntry.trim(), author: user?.email });
    setNewEntry("");
  };

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="relative pl-6 space-y-4">
        {/* vertical line */}
        <div className="absolute left-[9px] top-0 bottom-0 w-px bg-border" />

        {timeline.map((entry, i) => {
          const isLast = i === timeline.length - 1;
          const isCompleted = isLast && (taskStatus === "completed" || taskStatus === "cancelled");
          return (
            <div key={i} className="relative flex gap-3">
              {/* dot */}
              <div className="absolute -left-[3px] mt-1">
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 bg-background" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground bg-background" />
                )}
              </div>
              <div className="ml-4 space-y-0.5">
                <p className="text-sm">{entry.message}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(entry.timestamp), "dd MMM yyyy, HH:mm")}
                  </span>
                  {entry.author && (
                    <Badge variant="outline" className="text-xs py-0 h-4">
                      {entry.author}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add entry form (admin only or any logged-in user) */}
      {taskStatus !== "completed" && taskStatus !== "cancelled" && (
        <form onSubmit={handleAdd} className="flex gap-2 pt-2 border-t">
          <Input
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            placeholder="Add a milestone or note…"
            disabled={isPending}
          />
          <Button type="submit" size="sm" disabled={!newEntry.trim() || isPending}>
            <PlusCircle className="h-4 w-4 mr-1" />
            Add
          </Button>
        </form>
      )}
    </div>
  );
}
