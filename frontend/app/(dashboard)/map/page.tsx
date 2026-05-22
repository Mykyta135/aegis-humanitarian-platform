"use client";

import { AssetListPanel } from "@/components/maps/AssetListPanel";
import { DispatchVolunteerDialog } from "@/components/maps/DispatchVolunteerDialog";
import { MapContextMenu } from "@/components/maps/MapContextMenu";
import { MapFilterBar } from "@/components/maps/MapFilterBar";
import { SimulationPanel } from "@/components/maps/SimulationPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { type LiveLocation } from "@/hooks/use-live-operations";
import { useResources } from "@/hooks/use-resources";
import { useTasks } from "@/hooks/use-tasks";
import { useVolunteers } from "@/hooks/use-volunteers";
import { useFilterStore } from "@/stores/use-filter.store";
import { useMissionWizardStore } from "@/stores/use-mission-wizard.store";
import "leaflet-draw/dist/leaflet.draw.css";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import L from "leaflet";
import { useQueryClient } from "@tanstack/react-query";

const DynamicOperationsMap = dynamic(
  () => import("@/components/maps/OperationsMap").then((mod) => mod.OperationsMap),
  {
    ssr: false,
    loading: () => <Skeleton className="absolute inset-0 h-full w-full" />,
  }
);

export default function MapPage() {
  const { filters } = useFilterStore();
  const { data: tasks, isLoading: l1, isError: e1 } = useTasks({});
  const { data: volunteers, isLoading: l2, isError: e2 } = useVolunteers(filters.volunteers);
  const { data: resources, isLoading: l3, isError: e3 } = useResources(filters.resources);
  const queryClient = useQueryClient();
  const { openWizard, pickingMode, setEndLatLng, geocodedLatLng, geocodedLabel } = useMissionWizardStore();

  const [liveLocations, setLiveLocations] = useState<Record<string, LiveLocation>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [hoveredAssetId, setHoveredAssetId] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [nearbyCenter, setNearbyCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [dispatchDialog, setDispatchDialog] = useState<{ open: boolean; latLng: L.LatLng | null }>({ open: false, latLng: null });
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    latLng: L.LatLng | null;
  }>({ isOpen: false, position: { x: 0, y: 0 }, latLng: null });

  const handleAssetClick = useCallback((id: string, location: { lat: number; lng: number }) => {
    setHoveredAssetId(id);
    setFlyTarget({ ...location, zoom: 14 });
  }, []);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000");
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onLocationUpdate = (v: LiveLocation) =>
      setLiveLocations((p) => ({ ...p, [v.userId]: v }));
    const onSimulationComplete = (payload: { taskId: string; volunteerName: string }) => {
      toast.success(`Mission complete — ${payload.volunteerName} has arrived!`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      queryClient.invalidateQueries({ queryKey: ["simulationStatus"] });
    };
    const onNotification = (payload: { type: string }) => {
      if (["task_created", "task_completed", "task_cancelled"].includes(payload.type)) {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["volunteers"] });
        queryClient.invalidateQueries({ queryKey: ["resources"] });
      }
      if (["volunteer_added"].includes(payload.type)) {
        queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      }
      if (["resource_added"].includes(payload.type)) {
        queryClient.invalidateQueries({ queryKey: ["resources"] });
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("locationUpdate", onLocationUpdate);
    socket.on("simulationComplete", onSimulationComplete);
    socket.on("notification", onNotification);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("locationUpdate", onLocationUpdate);
      socket.off("simulationComplete", onSimulationComplete);
      socket.off("notification", onNotification);
      socket.disconnect();
    };
  }, [queryClient]);

  const isError = e1 || e2 || e3;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 border-b bg-background flex justify-between items-center z-20">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Global Operations Map</h1>
          <p className="text-sm text-muted-foreground">Real-time overview of missions and assets.</p>
        </div>
        <div className="flex items-center gap-4">
          <MapFilterBar />
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm font-medium">{isConnected ? "Live" : "Disconnected"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 grow overflow-hidden">
        <div className="col-span-1 bg-background border-r z-20 overflow-hidden flex flex-col min-h-0">
          <AssetListPanel
            volunteers={volunteers}
            resources={resources}
            tasks={tasks}
            hoveredAssetId={hoveredAssetId}
            onAssetHover={setHoveredAssetId}
            onAssetClick={handleAssetClick}
            nearbyCenter={nearbyCenter}
            onClearNearby={() => setNearbyCenter(null)}
          />
        </div>

        <div className="col-span-3 relative">
          {isError && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-sm">
              Error loading some data
            </div>
          )}
          <SimulationPanel tasks={tasks ?? []} />
          <DynamicOperationsMap
            tasks={tasks ?? []}
            volunteers={volunteers ?? []}
            resources={resources ?? []}
            liveLocations={liveLocations}
            hoveredAssetId={hoveredAssetId}
            onMarkerHover={setHoveredAssetId}
            flyTarget={flyTarget}
            pickingMode={pickingMode}
            onMapClick={(latlng) => {
              if (pickingMode === "end") setEndLatLng(latlng);
            }}
            geocodedPin={geocodedLatLng ? { lat: geocodedLatLng.lat, lng: geocodedLatLng.lng, label: geocodedLabel ?? "" } : null}
            onContextMenu={(e) =>
              setContextMenu({
                isOpen: true,
                position: { x: e.originalEvent.clientX, y: e.originalEvent.clientY },
                latLng: e.latlng,
              })
            }
          />
          <MapContextMenu
            isOpen={contextMenu.isOpen}
            position={contextMenu.position}
            latLng={contextMenu.latLng}
            onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
            onCreateTask={(latLng) => {
              openWizard(latLng);
              setContextMenu((prev) => ({ ...prev, isOpen: false }));
            }}
            onRequestSupport={(latLng) => {
              toast.info("Opening support request wizard…");
              openWizard(latLng);
            }}
            onDispatch={(latLng) => {
              setDispatchDialog({ open: true, latLng });
              setContextMenu((prev) => ({ ...prev, isOpen: false }));
            }}
            onViewResources={(latLng) => {
              setNearbyCenter({ lat: latLng.lat, lng: latLng.lng });
              setFlyTarget({ lat: latLng.lat, lng: latLng.lng, zoom: 12 });
              toast.info("Showing resources within 10 km of selected point.");
            }}
          />
        </div>
      </div>

      <DispatchVolunteerDialog
        open={dispatchDialog.open}
        latLng={dispatchDialog.latLng}
        onClose={() => setDispatchDialog({ open: false, latLng: null })}
      />
    </div>
  );
}
