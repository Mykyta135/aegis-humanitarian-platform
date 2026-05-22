"use client";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Resource } from "@/hooks/use-resources";
import { Task } from "@/hooks/use-tasks";
import { Volunteer } from "@/hooks/use-volunteers";
import { cn } from "@/lib/utils";
import { useFilterStore } from "@/stores/use-filter.store";
import { MapPin, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface AssetListPanelProps {
  volunteers: Volunteer[] | undefined;
  resources: Resource[] | undefined;
  tasks: Task[] | undefined;
  hoveredAssetId: string | null;
  onAssetHover: (id: string | null) => void;
  onAssetClick: (id: string, location: { lat: number; lng: number }) => void;
  nearbyCenter?: { lat: number; lng: number } | null;
  onClearNearby?: () => void;
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

const volunteerStatusColors: Record<string, string> = {
  available: "bg-green-100 text-green-800 border-green-200",
  on_mission: "bg-orange-100 text-orange-800 border-orange-200",
  unavailable: "bg-gray-100 text-gray-600 border-gray-200",
};

const resourceStatusColors: Record<string, string> = {
  available: "bg-green-100 text-green-800 border-green-200",
  in_use: "bg-orange-100 text-orange-800 border-orange-200",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const taskStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-orange-100 text-orange-800 border-orange-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

const priorityDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

type Tab = "volunteers" | "resources" | "missions";

export function AssetListPanel({
  volunteers,
  resources,
  tasks,
  hoveredAssetId,
  onAssetHover,
  onAssetClick,
  nearbyCenter,
  onClearNearby,
}: AssetListPanelProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("volunteers");
  const { filters } = useFilterStore();

  // Auto-switch to resources tab when a nearby centre is set
  useEffect(() => {
    if (nearbyCenter) setActiveTab("resources");
  }, [nearbyCenter]);

  const q = search.toLowerCase().trim();
  const vf = filters.volunteers;
  const rf = filters.resources;

  const filteredVolunteers = (volunteers ?? []).filter((v) => {
    if (vf.name && !v.name.toLowerCase().includes(vf.name.toLowerCase())) return false;
    if (vf.skill && !v.skills.some((s) => s.toLowerCase() === vf.skill!.toLowerCase())) return false;
    if (vf.experienceLevel && v.experienceLevel !== vf.experienceLevel) return false;
    if (vf.status && v.status !== vf.status) return false;
    if (q && !v.name.toLowerCase().includes(q) && !v.skills.some((s) => s.toLowerCase().includes(q))) return false;
    return true;
  });

  const NEARBY_KM = 10;
  const filteredResources = (resources ?? []).filter((r) => {
    if (rf.name && !r.name.toLowerCase().includes(rf.name.toLowerCase())) return false;
    if (rf.type && r.type !== rf.type) return false;
    if (rf.condition && r.condition !== rf.condition) return false;
    if (rf.status && r.status !== rf.status) return false;
    if (q && !r.name.toLowerCase().includes(q) && !(r.type ?? "").toLowerCase().includes(q)) return false;
    if (nearbyCenter && r.location) {
      const dist = haversineKm(
        [nearbyCenter.lat, nearbyCenter.lng],
        [r.location.lat, r.location.lng]
      );
      if (dist > NEARBY_KM) return false;
    }
    return true;
  });

  const filteredTasks = (tasks ?? []).filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      (t.region ?? "").toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q) ||
      (t.assignee?.name ?? "").toLowerCase().includes(q) ||
      (t.priority ?? "").toLowerCase().includes(q)
  );

  const volunteersWithLocation = filteredVolunteers.filter((v) => v.homeBase);
  const volunteersNoLocation = filteredVolunteers.filter((v) => !v.homeBase);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "volunteers", label: "Volunteers", count: filteredVolunteers.length },
    { id: "resources", label: "Resources", count: filteredResources.length },
    { id: "missions", label: "Missions", count: filteredTasks.length },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets & missions…"
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-2 text-[11px] font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span className="ml-1 text-[10px] opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">

          {/* ── Volunteers ── */}
          {activeTab === "volunteers" && (
            <>
              {volunteersWithLocation.map((v) => (
                <div
                  key={v.id}
                  className={cn(
                    "p-2.5 border rounded-lg cursor-pointer transition-all group",
                    hoveredAssetId === v.id
                      ? "bg-primary/5 border-primary/30 shadow-sm"
                      : "hover:bg-muted hover:border-muted-foreground/20"
                  )}
                  onMouseEnter={() => onAssetHover(v.id)}
                  onMouseLeave={() => onAssetHover(null)}
                  onClick={() => onAssetClick(v.id, v.homeBase!)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{v.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {v.skills.slice(0, 3).join(", ")}
                        {v.skills.length > 3 && ` +${v.skills.length - 3}`}
                      </p>
                      {v.experienceLevel && (
                        <p className="text-xs text-muted-foreground capitalize">{v.experienceLevel}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", volunteerStatusColors[v.status] ?? "")}>
                        {v.status.replace("_", " ")}
                      </span>
                      <MapPin className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              ))}

              {volunteersNoLocation.length > 0 && (
                <>
                  {volunteersWithLocation.length > 0 && (
                    <p className="text-xs text-muted-foreground pt-1 pb-0.5">No location data</p>
                  )}
                  {volunteersNoLocation.map((v) => (
                    <div key={v.id} className="p-2.5 border rounded-lg opacity-50 cursor-default">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{v.name}</p>
                          <p className="text-xs text-muted-foreground">No location</p>
                        </div>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0", volunteerStatusColors[v.status] ?? "")}>
                          {v.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {filteredVolunteers.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No volunteers found</p>
              )}
            </>
          )}

          {/* ── Resources ── */}
          {activeTab === "resources" && (
            <>
              {nearbyCenter && (
                <div className="flex items-center justify-between gap-2 px-1 py-1 mb-1 rounded bg-blue-50 border border-blue-200 text-xs text-blue-800">
                  <span>Showing resources within {NEARBY_KM} km of selected point</span>
                  <button onClick={onClearNearby} className="shrink-0 hover:text-blue-600">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {filteredResources.map((r) => (
                <div
                  key={r.id}
                  className={cn(
                    "p-2.5 border rounded-lg cursor-pointer transition-all group",
                    hoveredAssetId === r.id
                      ? "bg-primary/5 border-primary/30 shadow-sm"
                      : "hover:bg-muted hover:border-muted-foreground/20",
                    !r.location && "opacity-50 cursor-default"
                  )}
                  onMouseEnter={() => r.location && onAssetHover(r.id)}
                  onMouseLeave={() => onAssetHover(null)}
                  onClick={() => r.location && onAssetClick(r.id, r.location)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {r.type?.replace("_", " ")}
                        {r.condition && ` · ${r.condition.replace("_", " ")}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", resourceStatusColors[r.status] ?? "")}>
                        {r.status.replace("_", " ")}
                      </span>
                      {r.location && (
                        <MapPin className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredResources.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No resources found</p>
              )}
            </>
          )}

          {/* ── Missions ── */}
          {activeTab === "missions" && (
            <>
              {filteredTasks.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    "p-2.5 border rounded-lg transition-all group",
                    t.startLocation ? "cursor-pointer hover:bg-muted hover:border-muted-foreground/20" : "cursor-default opacity-60"
                  )}
                  onClick={() => t.startLocation && onAssetClick(t.id, t.startLocation)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {t.priority && (
                          <div className={cn("h-2 w-2 rounded-full shrink-0", priorityDot[t.priority] ?? "bg-gray-400")} title={t.priority} />
                        )}
                        <p className="font-semibold text-sm truncate">{t.title}</p>
                      </div>
                      {t.region && (
                        <p className="text-xs text-muted-foreground truncate">{t.region}</p>
                      )}
                      {t.assignee && (
                        <p className="text-xs text-muted-foreground truncate">→ {t.assignee.name}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", taskStatusColors[t.status] ?? "")}>
                        {t.status.replace("_", " ")}
                      </span>
                      {t.startLocation && (
                        <MapPin className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                  <div className="mt-1.5 flex gap-2">
                    <Link
                      href={`/tasks/${t.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Details →
                    </Link>
                    {!t.startLocation && (
                      <span className="text-[11px] text-muted-foreground">No map location</span>
                    )}
                  </div>
                </div>
              ))}

              {filteredTasks.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No missions found</p>
              )}
            </>
          )}

        </div>
      </ScrollArea>
    </div>
  );
}
