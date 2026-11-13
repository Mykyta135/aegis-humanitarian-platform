"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MissionLog } from "@/components/dashboard/MissionLog";
import { useAuthStore } from "@/stores/use-auth.store";
import { useTask } from "@/hooks/use-task";
import { useTaskRoute } from "@/hooks/use-task-route";
import { useVolunteers } from "@/hooks/use-volunteers";
import { useUpdateTaskStatus } from "@/hooks/use-update-task-status";
import { api } from "@/lib/axios";
import { AlertTriangle, CheckCircle2, MapPin, Phone, Play, UserPlus, UserMinus, XCircle, RefreshCw } from "lucide-react";
import { VolunteerRequestPanel } from "@/components/dashboard/VolunteerRequestPanel";
import { ResourceRequestPanel } from "@/components/dashboard/ResourceRequestPanel";
import { SuggestionList } from "@/components/dashboard/SuggestionList";
import { useTaskSuggestions, type Suggestion } from "@/hooks/use-task-suggestions";
import { useSendVolunteerRequest } from "@/hooks/use-volunteer-requests";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { connectSocket } from "@/lib/socket";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const DynamicMissionMap = dynamic(
  () => import("@/components/maps/MissionMap").then((m) => m.MissionMap),
  { ssr: false, loading: () => <Skeleton className="w-full h-[400px] rounded-lg" /> }
);

const DynamicRouteAlternatives = dynamic(
  () => import("@/components/maps/RouteAlternativesPanel").then((m) => m.RouteAlternativesPanel),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full" /> }
);

// ─── Snap alert ──────────────────────────────────────────────────────────────
function SnapAlert({ taskId, hasLocations }: { taskId: string; hasLocations: boolean }) {
  const { data: result } = useTaskRoute(taskId, hasLocations);
  if (!result) return null;
  const issues: { label: string; distanceM: number }[] = [];
  if (result.snappedStart?.wasSnapped)
    issues.push({ label: "start location", distanceM: result.snappedStart.distanceM });
  if (result.snappedEnd?.wasSnapped)
    issues.push({ label: "destination", distanceM: result.snappedEnd.distanceM });
  if (issues.length === 0) return null;
  return (
    <div className="flex gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
      <AlertTriangle className="h-5 w-5 shrink-0 text-orange-500 mt-0.5" />
      <div className="space-y-1">
        <p className="font-semibold">Off-road coordinates detected</p>
        {issues.map((issue) => (
          <p key={issue.label}>
            The {issue.label} is <strong>{issue.distanceM}m</strong> from the nearest drivable road.
          </p>
        ))}
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  in_progress: "bg-orange-100 text-orange-800 border-orange-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-gray-100 text-gray-600 border-gray-300",
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-green-100 text-green-800 border-green-300",
};

// ─── Assign volunteer dialog ──────────────────────────────────────────────────
function AssignVolunteerDialog({
  taskId,
  currentAssigneeId,
  requiredSkills,
  open,
  onClose,
}: {
  taskId: string;
  currentAssigneeId?: string;
  requiredSkills?: string[];
  open: boolean;
  onClose: () => void;
}) {
  const { data: volunteers = [] } = useVolunteers({});
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(currentAssigneeId ?? "");
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);

  const needsSkills = requiredSkills && requiredSkills.length > 0;

  const available = volunteers.filter(
    (v) => v.status === "available" || v.id === currentAssigneeId
  );

  // Volunteers that match at least one required skill
  const matched = needsSkills
    ? available.filter((v) => requiredSkills!.some((s) => v.skills.includes(s)))
    : available;

  const displayed = showAll || !needsSkills ? available : matched;

  const handleSave = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      await api.patch(`/tasks/${taskId}`, { assigneeId: selectedId });
      toast.success("Volunteer assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Failed to assign volunteer");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await api.patch(`/tasks/${taskId}`, { assigneeId: null });
      toast.success("Volunteer removed from mission");
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Failed to remove volunteer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm z-9999">
        <DialogHeader>
          <DialogTitle>Assign Volunteer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {needsSkills && (
            <div className="text-xs text-muted-foreground">
              Required skills:{" "}
              <span className="font-medium text-foreground">{requiredSkills!.join(", ")}</span>
              {matched.length < available.length && (
                <button
                  className="ml-2 underline"
                  onClick={() => setShowAll((p) => !p)}
                >
                  {showAll ? "Show matching only" : `Show all (${available.length})`}
                </button>
              )}
            </div>
          )}
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a volunteer…" />
            </SelectTrigger>
            <SelectContent>
              {displayed.map((v) => {
                const isMatch = needsSkills && requiredSkills!.some((s) => v.skills.includes(s));
                return (
                  <SelectItem key={v.id} value={v.id}>
                    <span className={isMatch ? "font-medium" : ""}>{v.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({v.experienceLevel} · {v.skills.slice(0, 2).join(", ")})
                    </span>
                    {isMatch && <span className="ml-1 text-xs text-green-600">✓ match</span>}
                  </SelectItem>
                );
              })}
              {displayed.length === 0 && (
                <SelectItem value="_none" disabled>No matching volunteers available</SelectItem>
              )}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={!selectedId || loading}
              onClick={handleSave}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              {loading ? "Saving…" : "Assign"}
            </Button>
            {currentAssigneeId && (
              <Button
                variant="destructive"
                disabled={loading}
                onClick={handleRemove}
              >
                <UserMinus className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TaskDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const queryClient = useQueryClient();

  const currentUser = useAuthStore((s) => s.user);
  const { data: task, isLoading, isError, refetch } = useTask(id);
  const { mutate: updateStatus, isPending: statusPending } = useUpdateTaskStatus();
  const [assignOpen, setAssignOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const { mutate: findSuggestions, isPending: isFindingSuggestions } = useTaskSuggestions();
  const { mutate: sendRequest, isPending: isSendingRequest } = useSendVolunteerRequest();

  // ── Real-time updates via WebSocket ──────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const socket = connectSocket({ transports: ["websocket"] });

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: ["task", id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      queryClient.invalidateQueries({ queryKey: ["simulationStatus"] });
    };

    socket.on("simulationComplete", (payload: { taskId: string }) => {
      if (payload.taskId === id) {
        toast.success("Simulation complete — mission arrived at destination");
        invalidateAll();
      }
    });

    socket.on("notification", (payload: { type: string; meta?: { taskId?: string } }) => {
      if (payload.meta?.taskId === id) {
        invalidateAll();
      }
    });

    return () => { socket.disconnect(); };
  }, [id, queryClient]);

  if (isLoading && !task) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (isError || !task || !id) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-xl font-semibold">Mission Not Found</h2>
        <p className="text-muted-foreground">Failed to load mission data.</p>
      </div>
    );
  }

  const hasLocations = !!task.startLocation && !!task.endLocation;
  const isPending = task.status === "pending";
  const isInProgress = task.status === "in_progress";
  const isTerminal = task.status === "completed" || task.status === "cancelled";

  const isAssignee = !!currentUser && task.assignee?.id === currentUser.id;
  const isCreator = !!currentUser && task.creatorId === currentUser.id;
  const canStart = isAssignee;
  const canCancel = isAssignee || isCreator;
  const canComplete = isAssignee;
  const canReassign = isCreator;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge
              variant="outline"
              className={STATUS_STYLES[task.status] ?? ""}
            >
              {task.status.replace("_", " ").toUpperCase()}
            </Badge>
            {task.priority && (
              <Badge variant="outline" className={PRIORITY_STYLES[task.priority] ?? ""}>
                {task.priority.toUpperCase()}
              </Badge>
            )}
            {task.region && (
              <span className="text-sm text-muted-foreground">{task.region}</span>
            )}
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Assign / reassign volunteer — only creator */}
          {!isTerminal && canReassign && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              {task.assignee ? "Reassign" : "Assign Volunteer"}
            </Button>
          )}

          {/* I've arrived — only the assignee, only when pending */}
          {isPending && task.assignee && isAssignee && (
            <Button
              size="sm"
              variant="outline"
              className="border-blue-400 text-blue-700 hover:bg-blue-50"
              onClick={async () => {
                try {
                  await api.patch(`/tasks/${id}/arrive`);
                  queryClient.invalidateQueries({ queryKey: ["task", id] });
                  toast.success("Arrival logged — you can now start the mission");
                } catch (e: any) {
                  toast.error(e.response?.data?.message ?? "Failed to log arrival");
                }
              }}
            >
              <MapPin className="h-4 w-4 mr-1" />
              I've Arrived
            </Button>
          )}

          {/* Start mission — only the assigned volunteer */}
          {isPending && task.assignee && canStart && (
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={statusPending}
              onClick={async () => {
                try {
                  await api.patch(`/tasks/${id}/start`);
                  queryClient.invalidateQueries({ queryKey: ["task", id] });
                  queryClient.invalidateQueries({ queryKey: ["tasks"] });
                  queryClient.invalidateQueries({ queryKey: ["volunteers"] });
                  toast.success("Mission started");
                } catch (e: any) {
                  toast.error(e.response?.data?.message ?? "Failed to start mission");
                }
              }}
            >
              <Play className="h-4 w-4 mr-1" />
              Start Mission
            </Button>
          )}

          {/* Complete mission — only assignee */}
          {isInProgress && canComplete && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={statusPending}
              onClick={() =>
                updateStatus(
                  { id, status: "completed" },
                  {
                    onSuccess: () => {
                      queryClient.invalidateQueries({ queryKey: ["task", id] });
                      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
                    },
                  }
                )
              }
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Mark Complete
            </Button>
          )}

          {/* Cancel mission — only creator or assignee */}
          {!isTerminal && canCancel && (
            <Button
              variant="destructive"
              size="sm"
              disabled={statusPending}
              onClick={() =>
                updateStatus(
                  { id, status: "cancelled" },
                  {
                    onSuccess: () => {
                      queryClient.invalidateQueries({ queryKey: ["task", id] });
                      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
                    },
                  }
                )
              }
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* ── Mission info summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Assignee</p>
          <p className="font-semibold text-sm mt-0.5">
            {task.assignee?.name ?? (
              <span className="text-muted-foreground italic">Unassigned</span>
            )}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Difficulty</p>
          <p className="font-semibold text-sm mt-0.5 capitalize">{task.difficulty ?? "—"}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Est. Duration</p>
          <p className="font-semibold text-sm mt-0.5">
            {task.estimatedDurationHours ? `${task.estimatedDurationHours}h` : "—"}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Required Skills</p>
          <p className="font-semibold text-sm mt-0.5">
            {task.requiredSkills?.join(", ") || "—"}
          </p>
        </Card>
      </div>

      {task.description && (
        <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
      )}

      <SnapAlert taskId={id} hasLocations={hasLocations} />

      {/* ── Mission Route Map ── */}
      <Card>
        <CardHeader>
          <CardTitle>Mission Route</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <DynamicMissionMap
            taskId={id}
            startLocation={task.startLocation}
            endLocation={task.endLocation}
            center={task.startLocation ?? { lat: 50.45, lng: 30.52 }}
            volunteerHomeBase={task.assignee?.homeBase}
          />
        </CardContent>
      </Card>

      {/* Two-leg route explanation */}
      {task.assignee?.homeBase && task.startLocation && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm text-purple-800 space-y-1">
          <p className="font-semibold">Two-leg route</p>
          <p>
            <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-1.5 align-middle" />
            <strong>Leg 1 (dashed purple):</strong> Volunteer travels from home base to mission start point.
          </p>
          <p>
            <span className="inline-block w-3 h-1.5 bg-blue-500 mr-1.5 align-middle" />
            <strong>Leg 2 (blue):</strong> Volunteer executes the mission route to destination.
          </p>
        </div>
      )}

      <DynamicRouteAlternatives taskId={id} hasLocations={hasLocations} />

      {/* ── Mission Log ── */}
      <Card>
        <CardHeader>
          <CardTitle>Mission Log</CardTitle>
        </CardHeader>
        <CardContent>
          <MissionLog
            taskId={id}
            logs={task.logs ?? []}
            taskCreatedAt={task.createdAt}
            taskStatus={task.status}
          />
        </CardContent>
      </Card>

      {/* ── Volunteer Requests ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle>Volunteer Requests</CardTitle>
          {isCreator && !isTerminal && (
            <Button
              size="sm"
              variant="outline"
              disabled={isFindingSuggestions}
              onClick={() => {
                findSuggestions(
                  {
                    region: task.region,
                    difficulty: task.difficulty,
                    requiredSkills: task.requiredSkills,
                  },
                  {
                    onSuccess: (data) => {
                      setSuggestions(data.volunteers);
                      setSuggestionsOpen(true);
                    },
                  }
                );
              }}
            >
              {isFindingSuggestions ? "Searching…" : "Find Best Volunteers"}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isCreator && suggestionsOpen && suggestions.length > 0 && (
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Algorithm-Scored Suggestions
                </p>
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setSuggestionsOpen(false)}>
                  Hide
                </Button>
              </div>
              <SuggestionList
                title=""
                suggestions={suggestions}
                selectedId={null}
                onSelect={(volunteerId) => {
                  if (!currentUser) return;
                  sendRequest(
                    { taskId: id, requesterId: currentUser.id, targetId: volunteerId },
                    {
                      onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ["volunteer-requests", id] });
                        setSuggestionsOpen(false);
                        toast.success("Request sent to volunteer");
                      },
                    }
                  );
                }}
              />
              <p className="text-xs text-muted-foreground text-center">Click a volunteer to send them a request</p>
            </div>
          )}
          {isCreator && suggestionsOpen && suggestions.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No matching volunteers found for this mission's skills and region.</p>
          )}
          <VolunteerRequestPanel taskId={id} taskStatus={task.status} creatorId={task.creatorId} />
        </CardContent>
      </Card>

      {/* ── Resource Requests ── */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <ResourceRequestPanel taskId={id} taskStatus={task.status} creatorId={task.creatorId} />
        </CardContent>
      </Card>

      {/* ── Contact Info ── */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {task.creator && (
            <div>
              <p className="text-muted-foreground font-medium mb-1">Mission Organizer</p>
              <p className="font-semibold">{task.creator.name}</p>
              <p className="text-muted-foreground">{task.creator.email}</p>
              {task.creator.phone && (
                <p className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3 w-3" />{task.creator.phone}
                </p>
              )}
            </div>
          )}
          {task.assignee && (
            <div>
              <p className="text-muted-foreground font-medium mb-1">Assigned Volunteer</p>
              <p className="font-semibold">{task.assignee.name}</p>
              <p className="text-muted-foreground">{task.assignee.email}</p>
              {task.assignee.phone && (
                <p className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3 w-3" />{task.assignee.phone}
                </p>
              )}
            </div>
          )}
          {!task.creator && !task.assignee && (
            <p className="text-muted-foreground">No contact information available.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Assign dialog ── */}
      <AssignVolunteerDialog
        taskId={id}
        currentAssigneeId={task.assignee?.id}
        requiredSkills={task.requiredSkills}
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
      />
    </div>
  );
}
