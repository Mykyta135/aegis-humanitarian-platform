"use client";

import L from "leaflet";
import { Marker, Popup } from "react-leaflet";

interface InfraPoint {
  id: string;
  name: string;
  type: "hospital" | "shelter" | "checkpoint" | "supply_depot" | "evacuation";
  lat: number;
  lng: number;
  description?: string;
}

// Key humanitarian infrastructure points in Ukrainian conflict regions
const INFRA_POINTS: InfraPoint[] = [
  // Hospitals
  { id: "h1", name: "Kharkiv Regional Hospital", type: "hospital", lat: 49.99, lng: 36.23, description: "Major trauma center" },
  { id: "h2", name: "Zaporizhzhia City Hospital", type: "hospital", lat: 47.84, lng: 35.14, description: "Emergency medical facility" },
  { id: "h3", name: "Dnipro Medical Center", type: "hospital", lat: 48.46, lng: 35.05, description: "Regional medical hub" },
  { id: "h4", name: "Mykolaiv Emergency Hospital", type: "hospital", lat: 46.97, lng: 32.00 },
  // Shelters
  { id: "s1", name: "Kharkiv Metro Shelter", type: "shelter", lat: 49.98, lng: 36.25, description: "Underground metro shelter, capacity 5000+" },
  { id: "s2", name: "Zaporizhzhia Shelter Network", type: "shelter", lat: 47.85, lng: 35.12 },
  { id: "s3", name: "Dnipro Central Shelter", type: "shelter", lat: 48.45, lng: 35.06 },
  // Checkpoints
  { id: "c1", name: "Checkpoint Alpha (Kharkiv)", type: "checkpoint", lat: 49.60, lng: 36.58 },
  { id: "c2", name: "Checkpoint Bravo (Zaporizhzhia)", type: "checkpoint", lat: 47.55, lng: 35.45 },
  { id: "c3", name: "Checkpoint Charlie (Kherson)", type: "checkpoint", lat: 46.80, lng: 33.10 },
  // Supply Depots
  { id: "d1", name: "Dnipro Logistics Hub", type: "supply_depot", lat: 48.48, lng: 35.00, description: "Main humanitarian supply distribution center" },
  { id: "d2", name: "Kyiv Aid Warehouse", type: "supply_depot", lat: 50.42, lng: 30.55, description: "Central aid coordination warehouse" },
  { id: "d3", name: "Lviv Transit Depot", type: "supply_depot", lat: 49.83, lng: 24.01, description: "Western supply corridor hub" },
  // Evacuation points
  { id: "e1", name: "Zaporizhzhia Evacuation Point", type: "evacuation", lat: 47.83, lng: 35.18, description: "Civilian evacuation gathering point" },
  { id: "e2", name: "Kherson Evacuation Corridor", type: "evacuation", lat: 46.65, lng: 32.60 },
];

const TYPE_CONFIG: Record<InfraPoint["type"], { color: string; emoji: string; label: string }> = {
  hospital: { color: "#dc2626", emoji: "🏥", label: "Hospital" },
  shelter: { color: "#2563eb", emoji: "🏛️", label: "Shelter" },
  checkpoint: { color: "#d97706", emoji: "🚧", label: "Checkpoint" },
  supply_depot: { color: "#16a34a", emoji: "📦", label: "Supply Depot" },
  evacuation: { color: "#7c3aed", emoji: "🚑", label: "Evacuation Point" },
};

function makeIcon(type: InfraPoint["type"]) {
  const { emoji } = TYPE_CONFIG[type];
  return L.divIcon({
    html: `<div style="font-size:18px;text-align:center;line-height:24px">${emoji}</div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export function InfrastructureLayer() {
  return (
    <>
      {INFRA_POINTS.map((point) => {
        const config = TYPE_CONFIG[point.type];
        return (
          <Marker key={point.id} position={[point.lat, point.lng]} icon={makeIcon(point.type)}>
            <Popup minWidth={180}>
              <div className="space-y-1">
                <div className="font-bold text-sm">{point.name}</div>
                <div className="text-xs" style={{ color: config.color }}>
                  {config.emoji} {config.label}
                </div>
                {point.description && (
                  <div className="text-xs text-gray-600">{point.description}</div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
