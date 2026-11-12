"use client";

import { useTaskRoute } from "@/hooks/use-task-route";
import { decode } from "@googlemaps/polyline-codec";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { streetTiles } from "@/lib/tiles";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function pin(color: string): L.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z"
          fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="#fff" fill-opacity="0.85"/>
  </svg>`;
  return new L.DivIcon({ html: svg, iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -36], className: "" });
}

function accessPin(color: string): L.DivIcon {
  // Smaller diamond shape to distinguish access points from actual locations
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
    <polygon points="10,0 20,10 10,20 0,10" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="10" cy="10" r="3" fill="#fff"/>
  </svg>`;
  return new L.DivIcon({ html: svg, iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -12], className: "" });
}

const startPin = pin("#22c55e");
const endPin = pin("#ef4444");
const accessStartPin = accessPin("#f97316");
const accessEndPin = accessPin("#f97316");

interface Coordinates { lat: number; lng: number; }

interface MissionMapProps {
  taskId: string;
  startLocation?: Coordinates | null;
  endLocation?: Coordinates | null;
  center: Coordinates;
  volunteerHomeBase?: Coordinates | null;
}

function RouteLayer({
  startLocation,
  endLocation,
  taskId,
}: {
  startLocation?: Coordinates | null;
  endLocation?: Coordinates | null;
  taskId: string;
}) {
  const map = useMap();
  const fitted = useRef(false);
  const hasRoute = !!startLocation && !!endLocation;
  const { data: result } = useTaskRoute(taskId, hasRoute);

  useEffect(() => {
    if (fitted.current || !startLocation || !endLocation) return;
    map.fitBounds(
      [[startLocation.lat, startLocation.lng], [endLocation.lat, endLocation.lng]],
      { padding: [40, 40] }
    );
    fitted.current = true;
  }, [map, startLocation, endLocation]);

  const routeCoords: [number, number][] = result?.route
    ? (decode(result.route) as [number, number][])
    : [];

  const snapStart = result?.snappedStart?.wasSnapped ? result.snappedStart : null;
  const snapEnd = result?.snappedEnd?.wasSnapped ? result.snappedEnd : null;

  return (
    <>
      {/* Actual location markers */}
      {startLocation && (
        <Marker position={[startLocation.lat, startLocation.lng]} icon={startPin as unknown as L.Icon}>
          <Popup>
            <div className="font-semibold">Mission Start</div>
            {snapStart && (
              <div className="text-xs text-orange-600 mt-1">
                ⚠ Off-road location<br />
                Nearest road access: {snapStart.distanceM}m away
              </div>
            )}
          </Popup>
        </Marker>
      )}
      {endLocation && (
        <Marker position={[endLocation.lat, endLocation.lng]} icon={endPin as unknown as L.Icon}>
          <Popup>
            <div className="font-semibold">Mission Destination</div>
            {snapEnd && (
              <div className="text-xs text-orange-600 mt-1">
                ⚠ Off-road location<br />
                Nearest road access: {snapEnd.distanceM}m away
              </div>
            )}
          </Popup>
        </Marker>
      )}

      {/* Road access point markers (orange diamond) — only when snapping occurred */}
      {snapStart && (
        <Marker position={[snapStart.lat, snapStart.lng]} icon={accessStartPin as unknown as L.Icon}>
          <Popup>
            <div className="font-semibold text-orange-600">Road Access Point</div>
            <div className="text-xs mt-1">
              Nearest routable point to mission start.<br />
              Distance from target: <strong>{snapStart.distanceM}m</strong>
            </div>
          </Popup>
        </Marker>
      )}
      {snapEnd && (
        <Marker position={[snapEnd.lat, snapEnd.lng]} icon={accessEndPin as unknown as L.Icon}>
          <Popup>
            <div className="font-semibold text-orange-600">Road Access Point</div>
            <div className="text-xs mt-1">
              Nearest routable point to destination.<br />
              Distance from target: <strong>{snapEnd.distanceM}m</strong>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Dashed connector: original location → road access point */}
      {startLocation && snapStart && (
        <Polyline
          positions={[[startLocation.lat, startLocation.lng], [snapStart.lat, snapStart.lng]]}
          pathOptions={{ color: "#f97316", weight: 2, dashArray: "5 7", opacity: 0.8 }}
        />
      )}
      {endLocation && snapEnd && (
        <Polyline
          positions={[[endLocation.lat, endLocation.lng], [snapEnd.lat, snapEnd.lng]]}
          pathOptions={{ color: "#f97316", weight: 2, dashArray: "5 7", opacity: 0.8 }}
        />
      )}

      {/* Road route or straight-line fallback */}
      {routeCoords.length > 0 ? (
        <Polyline
          pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.85 }}
          positions={routeCoords}
        />
      ) : startLocation && endLocation ? (
        <Polyline
          pathOptions={{ color: "#94a3b8", weight: 3, dashArray: "8 8" }}
          positions={[[startLocation.lat, startLocation.lng], [endLocation.lat, endLocation.lng]]}
        />
      ) : null}
    </>
  );
}

const volunteerPin = pin("#8b5cf6");

export function MissionMap({ taskId, startLocation, endLocation, center, volunteerHomeBase }: MissionMapProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={10}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer attribution={streetTiles.attribution} url={streetTiles.url} />

      {/* Leg 1: volunteer home → mission start */}
      {volunteerHomeBase && startLocation && (
        <>
          <Marker position={[volunteerHomeBase.lat, volunteerHomeBase.lng]} icon={volunteerPin as unknown as L.Icon}>
            <Popup>
              <div className="font-semibold text-purple-700">Volunteer Home Base</div>
              <div className="text-xs mt-1">Leg 1 starts here — volunteer travels to mission start point.</div>
            </Popup>
          </Marker>
          <Polyline
            positions={[
              [volunteerHomeBase.lat, volunteerHomeBase.lng],
              [startLocation.lat, startLocation.lng],
            ]}
            pathOptions={{ color: "#8b5cf6", weight: 3, dashArray: "8 6", opacity: 0.75 }}
          />
        </>
      )}

      <RouteLayer
        taskId={taskId}
        startLocation={startLocation}
        endLocation={endLocation}
      />
    </MapContainer>
  );
}
