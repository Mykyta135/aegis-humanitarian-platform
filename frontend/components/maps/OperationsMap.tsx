"use client";

import { type LiveLocation } from "@/hooks/use-live-operations";
import { type Resource } from "@/hooks/use-resources";
import { type Task } from "@/hooks/use-tasks";
import { type Volunteer } from "@/hooks/use-volunteers";
import { useTaskRoutes } from "@/hooks/use-task-routes";
import { type RouteResult } from "@/hooks/use-task-route";
import { useConditionedRoute } from "@/hooks/use-conditioned-route";
import { decode } from "@googlemaps/polyline-codec";
import "@/lib/leaflet-fix";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import {
  LayerGroup,
  LayersControl,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { HighlightedMarker } from "./HighlightedMarker";
import { ThreatZonesLayer } from "./ThreatZonesLayer";
import { InfrastructureLayer } from "./InfrastructureLayer";
import { WeatherPrecipitationLayer } from "./WeatherLayer";
import { hasMapTiler, streetTiles } from "@/lib/tiles";
import {
  missionEndIcon,
  missionStartIcons,
  getResourceIcon,
  getVolunteerIcon,
  getMissionIcon,
} from "./map-icons";

const DynamicMapDrawControl = dynamic(
  () => import("./MapDrawControl").then((mod) => mod.MapDrawControl),
  { ssr: false }
);

// ─── Route Style + Conditions Configurator ───────────────────────────────────
export interface RouteConditions {
  /** Avoid threat zones — routing engine will penalise routes through them */
  avoidThreatZones: boolean;
  /** Weather severity (none/light/heavy) — affects road quality score */
  weatherSeverity: "none" | "light" | "heavy";
  /** Avoid unpaved roads (useful in mud/rain season) */
  avoidUnpaved: boolean;
  /** Night-time routing — prefer lit roads */
  nightMode: boolean;
  /** Vehicle load — heavy loads avoid steep terrain */
  vehicleLoad: "light" | "standard" | "heavy";
}

export interface RouteStyleConfig {
  onlyActive: boolean;
  weight: number;
  opacity: number;
  showSnappedLines: boolean;
  distinguishFallback: boolean;
  conditions: RouteConditions;
}

const DEFAULT_CONDITIONS: RouteConditions = {
  avoidThreatZones: true,
  weatherSeverity: "none",
  avoidUnpaved: false,
  nightMode: false,
  vehicleLoad: "standard",
};

const DEFAULT_STYLE: RouteStyleConfig = {
  onlyActive: false,
  weight: 5,
  opacity: 0.9,
  showSnappedLines: true,
  distinguishFallback: true,
  conditions: DEFAULT_CONDITIONS,
};

// How conditions modify route colour to signal risk level
function conditionRiskColor(cfg: RouteConditions, baseColor: string): string {
  let risk = 0;
  if (cfg.avoidThreatZones) risk += 0; // safe — zones avoided
  if (cfg.weatherSeverity === "heavy") risk += 2;
  else if (cfg.weatherSeverity === "light") risk += 1;
  if (cfg.nightMode) risk += 1;
  if (cfg.vehicleLoad === "heavy") risk += 1;
  if (risk >= 3) return "#ef4444"; // high risk — red
  if (risk >= 2) return "#f97316"; // medium risk — orange
  if (risk >= 1) return "#eab308"; // low risk — yellow
  return baseColor;
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface OperationsMapProps {
  tasks?: Task[];
  volunteers?: Volunteer[];
  resources?: Resource[];
  liveLocations: Record<string, LiveLocation>;
  hoveredAssetId: string | null;
  onMarkerHover: (id: string | null) => void;
  onContextMenu: (e: L.LeafletMouseEvent) => void;
  onMapClick?: (latlng: L.LatLng) => void;
  flyTarget?: { lat: number; lng: number; zoom?: number } | null;
  pickingMode?: "none" | "end";
  geocodedPin?: { lat: number; lng: number; label: string } | null;
}

// ─── Route Quality Badge ─────────────────────────────────────────────────────
// Attached to route polylines to show real vs fallback state
export function RouteQualityBadge({ isReal, distanceKm }: { isReal: boolean; distanceKm?: number }) {
  return (
    <div
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
        isReal
          ? "bg-green-50 text-green-700 border-green-300"
          : "bg-amber-50 text-amber-700 border-amber-300"
      }`}
    >
      {isReal ? "✓ Road route" : "⚠ Straight-line estimate"}
      {distanceKm !== undefined && ` · ${distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`}`}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

function polylineDistanceKm(coords: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) total += haversineKm(coords[i - 1], coords[i]);
  return total;
}

// ─── MapFlyTo ────────────────────────────────────────────────────────────────
function MapFlyTo({ target }: { target: { lat: number; lng: number; zoom?: number } | null | undefined }) {
  const map = useMapEvents({});
  React.useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], target.zoom ?? 13, { duration: 1.2 });
  }, [target, map]);
  return null;
}

function MapEvents({
  onContextMenu,
  onMapClick,
}: {
  onContextMenu: (e: L.LeafletMouseEvent) => void;
  onMapClick?: (latlng: L.LatLng) => void;
}) {
  useMapEvents({
    contextmenu: onContextMenu,
    click: (e) => { if (onMapClick) onMapClick(e.latlng); },
  });
  return null;
}

const MAP_CENTER: L.LatLngExpression = [48.3794, 31.1656];

// ─── Priority / Status colors ────────────────────────────────────────────────
const PRIORITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const STATUS_ROUTE_COLOR: Record<string, string> = {
  in_progress: "#f97316",
  pending: "#94a3b8",
  completed: "#22c55e",
  cancelled: "#6b7280",
};

// Checks whether conditions differ from the all-default state
function isNonDefault(c: RouteConditions): boolean {
  return (
    !c.avoidThreatZones ||
    c.weatherSeverity !== "none" ||
    c.avoidUnpaved ||
    c.nightMode ||
    c.vehicleLoad !== "standard"
  );
}

// ─── MissionRoute ─────────────────────────────────────────────────────────────
function MissionRoute({
  task,
  result,
  styleConfig,
}: {
  task: Task;
  result?: RouteResult;
  styleConfig: RouteStyleConfig;
}) {
  const router = useRouter();
  const hasLocations = !!task.startLocation && !!task.endLocation;
  const conditionsActive = isNonDefault(styleConfig.conditions);

  // Fetch conditioned route only when at least one condition is non-default
  const { data: conditionedResult } = useConditionedRoute(
    task.id,
    hasLocations && conditionsActive,
    styleConfig.conditions,
  );

  const startPos: L.LatLngExpression = [task.startLocation!.lat, task.startLocation!.lng];
  const endPos: L.LatLngExpression = [task.endLocation!.lat, task.endLocation!.lng];
  const statusKey = task.status as keyof typeof missionStartIcons;
  const startIcon = (missionStartIcons[statusKey] ?? missionStartIcons.pending) as unknown as L.Icon;

  // Route quality state
  const routeCoords: [number, number][] = result?.route
    ? (decode(result.route) as [number, number][])
    : [];
  const isRealRoute = routeCoords.length > 2; // real road route has many points; straight-line = 2
  const distanceKm = routeCoords.length > 0
    ? polylineDistanceKm(routeCoords)
    : haversineKm(
        [task.startLocation!.lat, task.startLocation!.lng],
        [task.endLocation!.lat, task.endLocation!.lng]
      );

  const baseRouteColor = styleConfig.distinguishFallback && !isRealRoute
    ? "#f59e0b"
    : (STATUS_ROUTE_COLOR[statusKey] ?? "#94a3b8");
  // Apply condition-based risk tinting (night, weather, heavy load → shift toward red)
  const routeColor = conditionRiskColor(styleConfig.conditions, baseRouteColor);

  const snapStart = result?.snappedStart?.wasSnapped ? result.snappedStart : null;
  const snapEnd = result?.snappedEnd?.wasSnapped ? result.snappedEnd : null;

  const priorityColor = PRIORITY_COLOR[task.priority] ?? "#94a3b8";

  const popupContent = (label: string) => (
    <div className="space-y-2 min-w-[220px]">
      <div className="flex items-start justify-between gap-2">
        <div className="font-bold text-sm leading-tight">{task.title}</div>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0"
          style={{ background: priorityColor + "22", color: priorityColor, border: `1px solid ${priorityColor}55` }}
        >
          {task.priority}
        </span>
      </div>
      {label && <div className="text-xs text-gray-500 font-medium">{label}</div>}
      <div className="text-xs text-gray-600 space-y-0.5">
        <div>Status: <span className="font-semibold capitalize">{task.status.replace("_", " ")}</span></div>
        {task.region && <div>Region: {task.region}</div>}
        {task.assignee && <div>Assignee: {task.assignee.name}</div>}
        {task.estimatedDurationHours && <div>Est. duration: {task.estimatedDurationHours}h</div>}
        {task.requiredSkills?.length > 0 && <div>Skills: {task.requiredSkills.join(", ")}</div>}
      </div>

      {/* Route quality indicator */}
      <div className="pt-1">
        <RouteQualityBadge isReal={isRealRoute} distanceKm={distanceKm} />
      </div>

      {!isRealRoute && (
        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          Route not yet computed — showing straight-line distance estimate
        </div>
      )}
      {snapStart && (
        <div className="text-[11px] text-orange-600 bg-orange-50 border border-orange-200 rounded px-2 py-1">
          ⚠ Start is off-road — nearest access {snapStart.distanceM}m away
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-1.5 pt-1 border-t">
        <button
          onClick={() => router.push(`/tasks/${task.id}`)}
          className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:opacity-90 font-medium"
        >
          View Details →
        </button>
        {task.status === "pending" && !task.assignee && (
          <button
            onClick={() => router.push(`/tasks/${task.id}?action=assign`)}
            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:opacity-90 font-medium"
          >
            Assign Volunteer
          </button>
        )}
        {task.status === "pending" && (
          <button
            onClick={() => router.push(`/tasks/${task.id}?action=start`)}
            className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:opacity-90 font-medium"
          >
            Start Mission
          </button>
        )}
        {task.status === "in_progress" && (
          <button
            onClick={() => router.push(`/tasks/${task.id}?action=complete`)}
            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:opacity-90 font-medium"
          >
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Marker position={startPos} icon={startIcon}>
        <Popup minWidth={230}>{popupContent("📍 Start Point")}</Popup>
      </Marker>
      <Marker position={endPos} icon={missionEndIcon as unknown as L.Icon}>
        <Popup minWidth={230}>{popupContent("🏁 Destination")}</Popup>
      </Marker>

      {styleConfig.showSnappedLines && snapStart && (
        <Polyline
          positions={[startPos, [snapStart.lat, snapStart.lng]]}
          pathOptions={{ color: "#f97316", weight: 2, dashArray: "4 6", opacity: 0.7 }}
        />
      )}
      {styleConfig.showSnappedLines && snapEnd && (
        <Polyline
          positions={[endPos, [snapEnd.lat, snapEnd.lng]]}
          pathOptions={{ color: "#f97316", weight: 2, dashArray: "4 6", opacity: 0.7 }}
        />
      )}

      {routeCoords.length > 0 ? (
        <Polyline
          positions={routeCoords}
          pathOptions={{
            color: routeColor,
            weight: styleConfig.weight,
            opacity: styleConfig.opacity,
            dashArray: !isRealRoute && styleConfig.distinguishFallback ? "10 8" : undefined,
          }}
        >
          <Popup minWidth={230}>{popupContent("🗺 Base Route")}</Popup>
        </Polyline>
      ) : (
        <Polyline
          positions={[startPos, endPos]}
          pathOptions={{ color: "#94a3b8", weight: 2, dashArray: "6 8", opacity: 0.5 }}
        />
      )}

      {/* Conditioned route overlay — shown as a distinct purple polyline when conditions are active */}
      {conditionsActive && conditionedResult?.route && (() => {
        const condCoords = decode(conditionedResult.route) as [number, number][];
        if (condCoords.length < 2) return null;
        const condDistKm = polylineDistanceKm(condCoords);
        return (
          <Polyline
            positions={condCoords}
            pathOptions={{
              color: "#8b5cf6",
              weight: styleConfig.weight + 1,
              opacity: 0.85,
              dashArray: "12 4",
            }}
          >
            <Popup minWidth={260}>
              <div className="space-y-2 text-xs">
                <p className="font-bold text-sm text-purple-700">⚙ Conditioned Route</p>
                <p className="text-gray-500">Profile: <span className="font-semibold">{conditionedResult.profile}</span></p>
                <div className="flex gap-3">
                  <span>📏 {condDistKm.toFixed(1)} km</span>
                  <span>⏱ {conditionedResult.durationMin} min</span>
                </div>
                {conditionedResult.avoidFeatures.length > 0 && (
                  <p>Avoiding: {conditionedResult.avoidFeatures.join(", ")}</p>
                )}
                {conditionedResult.conditionSummary.length > 0 && (
                  <ul className="space-y-0.5 text-purple-800 bg-purple-50 rounded px-2 py-1 border border-purple-200">
                    {conditionedResult.conditionSummary.map((s) => <li key={s}>• {s}</li>)}
                  </ul>
                )}
              </div>
            </Popup>
          </Polyline>
        );
      })()}
    </>
  );
}

// ─── AnimatedVolunteerMarker ──────────────────────────────────────────────────
function AnimatedVolunteerMarker({
  volunteer,
  liveLocation,
  isHovered,
  onMarkerHover,
}: {
  volunteer: Volunteer;
  liveLocation?: LiveLocation;
  isHovered: boolean;
  onMarkerHover: (id: string | null) => void;
}) {
  const router = useRouter();
  const markerRef = useRef<L.Marker>(null);
  const prevPos = useRef<L.LatLng | null>(null);

  const currentPos: L.LatLngExpression | null = liveLocation?.location
    ? [liveLocation.location.lat, liveLocation.location.lng]
    : volunteer.homeBase
    ? [volunteer.homeBase.lat, volunteer.homeBase.lng]
    : null;

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !currentPos) return;
    const target = L.latLng(currentPos as [number, number]);
    if (prevPos.current && prevPos.current.distanceTo(target) > 1) {
      const from = prevPos.current;
      const steps = 60;
      let step = 0;
      const timer = setInterval(() => {
        step++;
        const t = step / steps;
        marker.setLatLng([from.lat + (target.lat - from.lat) * t, from.lng + (target.lng - from.lng) * t]);
        if (step >= steps) { clearInterval(timer); prevPos.current = target; }
      }, 1000 / 60);
      return () => clearInterval(timer);
    }
    prevPos.current = target;
  }, [liveLocation, currentPos]);

  if (!currentPos) return null;

  return (
    <HighlightedMarker
      ref={markerRef}
      id={volunteer.id}
      position={currentPos}
      icon={getVolunteerIcon(volunteer.status)}
      isHovered={isHovered}
      onMarkerHover={onMarkerHover}
    >
      <Popup minWidth={210}>
        <div className="space-y-2">
          <div className="font-bold text-sm">
            {volunteer.name}
            {liveLocation && <span className="ml-1 text-red-500 animate-pulse">● LIVE</span>}
          </div>
          <div className="text-xs text-gray-600 space-y-0.5">
            <div>Status: <span className="font-semibold capitalize">{volunteer.status.replace("_", " ")}</span></div>
            <div>Skills: {volunteer.skills.join(", ")}</div>
            {liveLocation && (
              <div className="font-mono text-[10px] text-gray-400">
                {liveLocation.location.lat.toFixed(4)}, {liveLocation.location.lng.toFixed(4)}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1 border-t">
            <button
              onClick={() => router.push(`/volunteers/${volunteer.id}`)}
              className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:opacity-90 font-medium"
            >
              View Dossier →
            </button>
            {volunteer.status === "available" && (
              <button
                onClick={() => router.push(`/volunteers/${volunteer.id}?action=dispatch`)}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:opacity-90 font-medium"
              >
                Dispatch
              </button>
            )}
          </div>
        </div>
      </Popup>
    </HighlightedMarker>
  );
}

// ─── Route Style Panel ────────────────────────────────────────────────────────
function RouteStylePanel({
  config,
  onChange,
}: {
  config: RouteStyleConfig;
  onChange: (c: RouteStyleConfig) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-8 left-3 z-999">
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-white border rounded shadow px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 hover:bg-gray-50"
        title="Route rendering settings"
      >
        🛣 Route Style {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className="absolute bottom-8 left-0 bg-white border rounded shadow-lg p-3 w-64 space-y-3 text-xs overflow-y-auto max-h-[80vh]">

          {/* ── Display ── */}
          <p className="font-semibold text-[11px] uppercase text-gray-500 tracking-wide">Display</p>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={config.onlyActive}
              onChange={(e) => onChange({ ...config, onlyActive: e.target.checked })} />
            Only show in-progress routes
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={config.showSnappedLines}
              onChange={(e) => onChange({ ...config, showSnappedLines: e.target.checked })} />
            Show off-road access lines
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={config.distinguishFallback}
              onChange={(e) => onChange({ ...config, distinguishFallback: e.target.checked })} />
            Highlight straight-line fallbacks
          </label>

          <div>
            <div className="flex justify-between mb-1"><span>Line weight</span><span className="font-mono">{config.weight}px</span></div>
            <input type="range" min={2} max={10} step={1} value={config.weight}
              onChange={(e) => onChange({ ...config, weight: Number(e.target.value) })}
              className="w-full accent-primary" />
          </div>
          <div>
            <div className="flex justify-between mb-1"><span>Opacity</span><span className="font-mono">{Math.round(config.opacity * 100)}%</span></div>
            <input type="range" min={0.2} max={1} step={0.05} value={config.opacity}
              onChange={(e) => onChange({ ...config, opacity: Number(e.target.value) })}
              className="w-full accent-primary" />
          </div>

          {/* ── Field Conditions ── */}
          <div className="border-t pt-2 space-y-2">
            <p className="font-semibold text-[11px] uppercase text-gray-500 tracking-wide">⚔️ Field Conditions</p>

            {/* Legend */}
            <div className="flex flex-col gap-1 p-2 bg-gray-50 border rounded text-[10px] text-gray-600">
              <div className="flex items-center gap-2">
                <span className="inline-block w-8 h-1.5 rounded" style={{ background: "#6b7280" }} />
                <span>Base route (ORS driving-car)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-8 h-1.5 rounded border-dashed border border-purple-500" style={{ background: "#8b5cf6" }} />
                <span>Conditioned route (active when any condition set)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-8 h-1.5 rounded" style={{ background: "#ef4444" }} />
                <span>Risk tint (weather/night/load)</span>
              </div>
            </div>

            {/* ORS algorithm note */}
            <p className="text-[10px] text-gray-400 leading-tight">
              Each condition maps to real ORS routing parameters — the purple route is re-fetched from the routing engine with those constraints applied.
            </p>

            <label className="flex flex-col gap-0.5 cursor-pointer">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={config.conditions.avoidThreatZones}
                  onChange={(e) => onChange({ ...config, conditions: { ...config.conditions, avoidThreatZones: e.target.checked } })} />
                <span className="font-medium">⚠️ Avoid threat zones</span>
              </div>
              <span className="text-[9px] text-gray-400 ml-5">→ ORS: avoid_polygons (threat zone geometry)</span>
            </label>

            <label className="flex flex-col gap-0.5 cursor-pointer">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={config.conditions.avoidUnpaved}
                  onChange={(e) => onChange({ ...config, conditions: { ...config.conditions, avoidUnpaved: e.target.checked } })} />
                <span className="font-medium">🪨 Avoid unpaved roads</span>
              </div>
              <span className="text-[9px] text-gray-400 ml-5">→ ORS: avoid_features: ["unpavedroads"]</span>
            </label>

            <label className="flex flex-col gap-0.5 cursor-pointer">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={config.conditions.nightMode}
                  onChange={(e) => onChange({ ...config, conditions: { ...config.conditions, nightMode: e.target.checked } })} />
                <span className="font-medium">🌙 Night operation</span>
              </div>
              <span className="text-[9px] text-gray-400 ml-5">→ Risk tint: +1 · Flagged in summary</span>
            </label>

            <div>
              <div className="flex flex-col gap-0.5 mb-1">
                <span className="font-medium">🌧 Weather severity</span>
                <span className="text-[9px] text-gray-400">Heavy → avoid_features: ["unpavedroads","ferries"]</span>
              </div>
              <div className="flex gap-1">
                {(["none", "light", "heavy"] as const).map((w) => (
                  <button key={w}
                    onClick={() => onChange({ ...config, conditions: { ...config.conditions, weatherSeverity: w } })}
                    className={`flex-1 py-0.5 rounded border text-[10px] font-medium capitalize transition-colors ${
                      config.conditions.weatherSeverity === w
                        ? "bg-blue-100 border-blue-400 text-blue-800"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >{w}</button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex flex-col gap-0.5 mb-1">
                <span className="font-medium">🚛 Vehicle load</span>
                <span className="text-[9px] text-gray-400">Heavy → ORS profile: driving-hgv (different road restrictions)</span>
              </div>
              <div className="flex gap-1">
                {(["light", "standard", "heavy"] as const).map((v) => (
                  <button key={v}
                    onClick={() => onChange({ ...config, conditions: { ...config.conditions, vehicleLoad: v } })}
                    className={`flex-1 py-0.5 rounded border text-[10px] font-medium capitalize transition-colors ${
                      config.conditions.vehicleLoad === v
                        ? "bg-orange-100 border-orange-400 text-orange-800"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >{v}</button>
                ))}
              </div>
            </div>

            {/* Active effects summary */}
            {(() => {
              const c = config.conditions;
              const effects: { label: string; ors: string }[] = [];
              if (c.avoidThreatZones) effects.push({ label: "Routing around threat zones", ors: "avoid_polygons" });
              if (c.avoidUnpaved || c.weatherSeverity === "heavy") effects.push({ label: "Unpaved roads excluded", ors: "avoid_features: unpavedroads" });
              if (c.weatherSeverity === "heavy") effects.push({ label: "Ferries excluded", ors: "avoid_features: ferries" });
              if (c.vehicleLoad === "heavy") effects.push({ label: "HGV profile active", ors: "profile: driving-hgv" });
              if (c.nightMode) effects.push({ label: "Night flag active", ors: "risk +1" });
              if (effects.length === 0) return (
                <p className="text-[10px] text-gray-400 italic">No conditions active — base route shown only.</p>
              );
              return (
                <div className="p-2 bg-purple-50 border border-purple-200 rounded text-[10px] text-purple-800 space-y-1">
                  <p className="font-semibold">Active ORS parameters:</p>
                  {effects.map((e) => (
                    <div key={e.label} className="flex justify-between gap-2">
                      <span>• {e.label}</span>
                      <code className="text-purple-600 shrink-0">{e.ors}</code>
                    </div>
                  ))}
                  <p className="text-[9px] text-purple-500 pt-0.5">Purple dashed line = route computed with these constraints</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── OperationsMap ────────────────────────────────────────────────────────────
export function OperationsMap({
  tasks = [],
  volunteers = [],
  resources = [],
  liveLocations,
  hoveredAssetId,
  onMarkerHover,
  onContextMenu,
  onMapClick,
  flyTarget,
  pickingMode = "none",
  geocodedPin,
}: OperationsMapProps) {
  const router = useRouter();
  const [selectedArea, setSelectedArea] = React.useState<L.LatLngBounds | null>(null);
  const [styleConfig, setStyleConfig] = useState<RouteStyleConfig>(DEFAULT_STYLE);

  const activeMissions = tasks.filter((t) => {
    if (!t.startLocation || !t.endLocation) return false;
    if (styleConfig.onlyActive) return t.status === "in_progress";
    return t.status === "in_progress" || t.status === "pending";
  });

  const routeMap = useTaskRoutes(activeMissions.map((t) => t.id));

  const availableVolunteers = volunteers.filter((v) => {
    if (v.status !== "available" || !v.homeBase || typeof v.homeBase.lat !== "number") return false;
    if (!selectedArea) return true;
    return selectedArea.contains(L.latLng(v.homeBase.lat, v.homeBase.lng));
  });

  // Show animated marker for any volunteer that is on_mission OR has an active live location
  const volunteersOnMission = volunteers.filter(
    (v) => v.status === "on_mission" || liveLocations[v.id]
  );

  const availableResources = resources.filter((r) => {
    if (r.status !== "available" || !r.location || typeof r.location.lat !== "number") return false;
    if (!selectedArea) return true;
    return selectedArea.contains(L.latLng(r.location.lat, r.location.lng));
  });

  // All tasks with at least a start location (for the Missions layer)
  const allLocatedTasks = tasks.filter((t) => t.startLocation);

  return (
    <>
      <MapContainer
        center={MAP_CENTER}
        zoom={6}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ zIndex: 10 }}
      >
        {/* ── Base tile layers ── */}
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Streets">
            <TileLayer attribution={streetTiles.attribution} url={streetTiles.url} />
          </LayersControl.BaseLayer>

          {/* MapTiler-only layers appear when NEXT_PUBLIC_MAPTILER_API_KEY is set */}
          {hasMapTiler && (
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>'
                url={`https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`}
              />
            </LayersControl.BaseLayer>
          )}

          {hasMapTiler && (
            <LayersControl.BaseLayer name="Terrain">
              <TileLayer
                attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>'
                url={`https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`}
              />
            </LayersControl.BaseLayer>
          )}

          <LayersControl.BaseLayer name="Topo">
            <TileLayer
              attribution='&copy; <a href="https://www.opentopomap.org">OpenTopoMap</a>'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          {hasMapTiler && (
            <LayersControl.BaseLayer name="Dark">
              <TileLayer
                attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>'
                url={`https://api.maptiler.com/maps/dataviz-dark/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`}
              />
            </LayersControl.BaseLayer>
          )}

          {/* ── Overlay layers ── */}
          <LayersControl.Overlay checked name="🗺 Active Mission Routes">
            <LayerGroup>
              {activeMissions.map((task) => (
                <MissionRoute
                  key={task.id}
                  task={task}
                  result={routeMap[task.id]}
                  styleConfig={styleConfig}
                />
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="📋 All Missions">
            <LayerGroup>
              {allLocatedTasks.map((task) => {
                const icon = getMissionIcon(task.status, task.priority);
                return (
                  <Marker
                    key={`mission-${task.id}`}
                    position={[task.startLocation!.lat, task.startLocation!.lng]}
                    icon={icon as unknown as L.Icon}
                  >
                    <Popup minWidth={230}>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-sm leading-tight">{task.title}</div>
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0"
                            style={{
                              background: (PRIORITY_COLOR[task.priority] ?? "#94a3b8") + "22",
                              color: PRIORITY_COLOR[task.priority] ?? "#94a3b8",
                              border: `1px solid ${(PRIORITY_COLOR[task.priority] ?? "#94a3b8")}55`,
                            }}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-0.5">
                          <div>Status: <span className="font-semibold capitalize">{task.status.replace("_", " ")}</span></div>
                          {task.region && <div>Region: {task.region}</div>}
                          {task.assignee && <div>Assignee: {task.assignee.name}</div>}
                          {task.description && (
                            <div className="text-gray-500 line-clamp-2 mt-1">{task.description}</div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1 border-t">
                          <button
                            onClick={() => router.push(`/tasks/${task.id}`)}
                            className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:opacity-90 font-medium"
                          >
                            Mission Details →
                          </button>
                          {task.status === "pending" && !task.assignee && (
                            <button
                              onClick={() => router.push(`/tasks/${task.id}?action=assign`)}
                              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:opacity-90 font-medium"
                            >
                              Assign
                            </button>
                          )}
                          {task.status === "pending" && (
                            <button
                              onClick={() => router.push(`/tasks/${task.id}?action=request`)}
                              className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:opacity-90 font-medium"
                            >
                              Request Support
                            </button>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="👤 Available Volunteers">
            <LayerGroup>
              {availableVolunteers.map((volunteer) => (
                <HighlightedMarker
                  key={volunteer.id}
                  id={volunteer.id}
                  position={[volunteer.homeBase!.lat, volunteer.homeBase!.lng]}
                  icon={getVolunteerIcon(volunteer.status)}
                  isHovered={hoveredAssetId === volunteer.id}
                  onMarkerHover={onMarkerHover}
                >
                  <Popup minWidth={220}>
                    <div className="space-y-2">
                      <div className="font-bold text-sm">{volunteer.name}</div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <div>Experience: <span className="capitalize font-medium">{volunteer.experienceLevel}</span></div>
                        <div>Skills: {volunteer.skills.join(", ")}</div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t">
                        <button
                          onClick={() => router.push(`/volunteers/${volunteer.id}`)}
                          className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:opacity-90 font-medium"
                        >
                          View Dossier →
                        </button>
                        <button
                          onClick={() => router.push(`/volunteers/${volunteer.id}?action=dispatch`)}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:opacity-90 font-medium"
                        >
                          🚀 Dispatch
                        </button>
                        <button
                          onClick={() => router.push(`/manage?tab=volunteers&id=${volunteer.id}`)}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 font-medium"
                        >
                          Edit Profile
                        </button>
                      </div>
                    </div>
                  </Popup>
                </HighlightedMarker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="📦 Available Resources">
            <LayerGroup>
              {availableResources.map((resource) => (
                <HighlightedMarker
                  key={resource.id}
                  id={resource.id}
                  position={[resource.location!.lat, resource.location!.lng]}
                  icon={getResourceIcon(resource.type ?? undefined)}
                  isHovered={hoveredAssetId === resource.id}
                  onMarkerHover={onMarkerHover}
                >
                  <Popup minWidth={220}>
                    <div className="space-y-2">
                      <div className="font-bold text-sm">{resource.name}</div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <div>Type: <span className="capitalize font-medium">{resource.type?.replace("_", " ")}</span></div>
                        <div>Condition: <span className="capitalize">{resource.condition?.replace("_", " ") ?? "—"}</span></div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t">
                        <button
                          onClick={() => router.push(`/manage?tab=resources&id=${resource.id}`)}
                          className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:opacity-90 font-medium"
                        >
                          Resource Details →
                        </button>
                        <button
                          onClick={() => router.push(`/tasks/new?resourceId=${resource.id}`)}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:opacity-90 font-medium"
                        >
                          🎯 Assign to Mission
                        </button>
                        <button
                          onClick={() => router.push(`/manage?tab=resources&action=request&id=${resource.id}`)}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 font-medium"
                        >
                          Request Use
                        </button>
                      </div>
                    </div>
                  </Popup>
                </HighlightedMarker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="🔴 Live Volunteer Tracking">
            <LayerGroup>
              {volunteersOnMission.map((volunteer) => (
                <AnimatedVolunteerMarker
                  key={`live-${volunteer.id}`}
                  volunteer={volunteer}
                  liveLocation={liveLocations[volunteer.id]}
                  isHovered={hoveredAssetId === volunteer.id}
                  onMarkerHover={onMarkerHover}
                />
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="⚠️ Threat Zones">
            <LayerGroup>
              <ThreatZonesLayer />
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay name="🏥 Infrastructure & Humanitarian">
            <LayerGroup>
              <InfrastructureLayer />
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay name="🌧 Weather (Precipitation)">
            <LayerGroup>
              <WeatherPrecipitationLayer />
            </LayerGroup>
          </LayersControl.Overlay>

          {/* Administrative boundaries via OSM */}
          <LayersControl.Overlay name="🗂 District Borders">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              opacity={0.3}
            />
          </LayersControl.Overlay>

          {/* Hillshading for terrain context */}
          <LayersControl.Overlay name="⛰ Hillshading">
            <TileLayer
              attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>'
              url={`https://api.maptiler.com/tiles/hillshade/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`}
              opacity={0.5}
            />
          </LayersControl.Overlay>
        </LayersControl>

        <DynamicMapDrawControl
          onAreaSelected={setSelectedArea}
          onSelectionCleared={() => setSelectedArea(null)}
        />
        <MapEvents onContextMenu={pickingMode === "none" ? onContextMenu : () => {}} onMapClick={pickingMode === "end" ? onMapClick : undefined} />
        <MapFlyTo target={geocodedPin ?? flyTarget} />
        {geocodedPin && (
          <Marker position={[geocodedPin.lat, geocodedPin.lng]}>
            <Popup>{geocodedPin.label}</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Destination picking overlay banner */}
      {pickingMode === "end" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-9999 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg pointer-events-none select-none">
          Click on the map to set the destination
        </div>
      )}

      {/* Route style configurator — outside MapContainer so it can use regular React */}
      <RouteStylePanel config={styleConfig} onChange={setStyleConfig} />
    </>
  );
}
