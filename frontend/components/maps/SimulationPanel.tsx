"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { type Task } from "@/hooks/use-tasks";
import { useTaskRoutes } from "@/hooks/use-task-routes";
import { decode } from "@googlemaps/polyline-codec";
import {
  useSimulationStatus,
  useStartSimulation,
  useStopAllSimulations,
  useStopSimulation,
  useSetSimulationSpeed,
  useSeekSimulation,
} from "@/hooks/use-simulation";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Square,
  Play,
  StopCircle,
  Zap,
  SkipForward,
  CheckSquare,
  Route,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { useState, useMemo } from "react";

interface SimulationPanelProps {
  tasks: Task[];
}

/** Haversine distance in km between consecutive decoded points */
function polylineDistanceKm(encoded: string): number {
  const points = decode(encoded) as [number, number][];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const [lat1, lng1] = points[i - 1];
    const [lat2, lng2] = points[i];
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    total += 2 * R * Math.asin(Math.sqrt(a));
  }
  return total;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function SimulationPanel({ tasks }: SimulationPanelProps) {
  const [open, setOpen] = useState(false);
  const [speedMap, setSpeedMap] = useState<Record<string, number>>({});

  const { data: running = [] } = useSimulationStatus();
  const { mutate: start, isPending: starting } = useStartSimulation();
  const { mutate: stop } = useStopSimulation();
  const { mutate: stopAll } = useStopAllSimulations();
  const { mutate: setSpeed } = useSetSimulationSpeed();
  const { mutate: seek } = useSeekSimulation();

  // Only show tasks that are in_progress, have both locations, and have an assignee
  const simulatableTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status === "in_progress" &&
          t.startLocation &&
          t.endLocation &&
          t.assignee
      ),
    [tasks]
  );

  const runningIds = new Set(running.map((r) => r.taskId));
  const notRunning = simulatableTasks.filter((t) => !runningIds.has(t.id));

  // Fetch routes for preview
  const routeMap = useTaskRoutes(notRunning.map((t) => t.id));

  if (simulatableTasks.length === 0) return null;

  return (
    <div
      className="absolute bottom-4 right-4 z-[500] bg-background border rounded-xl shadow-lg overflow-hidden"
      style={{ width: 380 }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Movement Simulation</span>
          {running.length > 0 && (
            <Badge variant="default" className="text-[10px] h-4 px-1.5 bg-green-600">
              {running.length} live
            </Badge>
          )}
          {notRunning.length > 0 && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
              {notRunning.length} ready
            </Badge>
          )}
        </div>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>

      {open && (
        <div className="border-t divide-y max-h-[480px] overflow-y-auto">
          {/* ── RUNNING SIMULATIONS ── */}
          {running.map((sim) => {
            const localSpeed = speedMap[`live_${sim.taskId}`] ?? sim.speed;
            return (
              <div key={sim.taskId} className="px-4 py-3 space-y-2 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-primary truncate">{sim.volunteerName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {sim.speed}x speed · {sim.progress}% · {sim.currentIndex}/{sim.totalPoints} pts
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                    onClick={() => stop(sim.taskId)}
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                  </Button>
                </div>

                {/* Seek bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Progress</span>
                    <span className="font-medium">{sim.progress}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[sim.progress]}
                    onValueChange={([v]) => seek({ taskId: sim.taskId, percent: v })}
                    className="h-3"
                  />
                </div>

                {/* Live speed control */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Zap className="h-2.5 w-2.5" />Speed</span>
                    <span className="font-medium">{localSpeed}x</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Slider
                      min={1}
                      max={50}
                      step={1}
                      value={[localSpeed]}
                      onValueChange={([v]) => setSpeedMap((m) => ({ ...m, [`live_${sim.taskId}`]: v }))}
                      onPointerUp={() => {
                        const s = speedMap[`live_${sim.taskId}`] ?? sim.speed;
                        setSpeed({ taskId: sim.taskId, speed: s });
                      }}
                      className="h-3 flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2 shrink-0"
                      onClick={() => seek({ taskId: sim.taskId, percent: 100 })}
                    >
                      <SkipForward className="h-2.5 w-2.5 mr-1" />
                      Skip
                    </Button>
                  </div>
                </div>

                <Progress value={sim.progress} className="h-1" />
              </div>
            );
          })}

          {/* ── AVAILABLE TASKS (with route preview) ── */}
          {notRunning.map((task) => {
            const speed = speedMap[task.id] ?? 5;
            const routeResult = routeMap[task.id];
            const distKm = routeResult?.route
              ? polylineDistanceKm(routeResult.route)
              : task.startLocation && task.endLocation
              ? haversineKm(task.startLocation, task.endLocation)
              : null;
            const hasRoute = !!routeResult?.route;
            const wasSnapped =
              routeResult?.snappedStart?.wasSnapped || routeResult?.snappedEnd?.wasSnapped;

            return (
              <div key={task.id} className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{task.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {task.assignee?.name ?? "Unassigned"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs shrink-0 ml-2"
                    disabled={starting}
                    onClick={() => start({ taskId: task.id, speed })}
                  >
                    <Play className="h-3 w-3 mr-1 fill-current" />
                    Start
                  </Button>
                </div>

                {/* Route preview info */}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5">
                  <div className="flex items-center gap-1">
                    <Route className="h-3 w-3" />
                    {distKm !== null ? (
                      <span className="font-medium">
                        {distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`}
                      </span>
                    ) : (
                      <span>--</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{routeResult?.route ? `${decode(routeResult.route).length} pts` : "loading..."}</span>
                  </div>
                  {hasRoute ? (
                    <Badge variant="outline" className="text-[9px] h-3.5 px-1 text-green-600 border-green-300">
                      Road route
                    </Badge>
                  ) : routeResult ? (
                    <Badge variant="outline" className="text-[9px] h-3.5 px-1 text-yellow-600 border-yellow-300">
                      Straight line
                    </Badge>
                  ) : null}
                  {wasSnapped && (
                    <div className="flex items-center gap-0.5 text-orange-500">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      <span>Snapped</span>
                    </div>
                  )}
                </div>

                {/* Speed slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Speed</span>
                    <span className="font-medium">{speed}x</span>
                  </div>
                  <Slider
                    min={1}
                    max={50}
                    step={1}
                    value={[speed]}
                    onValueChange={([v]) => setSpeedMap((m) => ({ ...m, [task.id]: v }))}
                    className="h-3"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground/60">
                    <span>1x (real-time)</span>
                    <span>50x (fast)</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ── BULK CONTROLS ── */}
          {notRunning.length > 1 && (
            <div className="px-4 py-3">
              <Button
                variant="secondary"
                size="sm"
                className="w-full h-7 text-xs"
                disabled={starting}
                onClick={() =>
                  notRunning.forEach((t) =>
                    start({ taskId: t.id, speed: speedMap[t.id] ?? 5 })
                  )
                }
              >
                <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                Start all ({notRunning.length})
              </Button>
            </div>
          )}

          {running.length > 1 && (
            <div className="px-4 py-3">
              <Button
                variant="destructive"
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() => stopAll()}
              >
                <StopCircle className="h-3.5 w-3.5 mr-1.5" />
                Stop all ({running.length})
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
