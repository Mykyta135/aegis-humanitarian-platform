"use client";

import { useThreatZones, type ThreatZone } from "@/hooks/use-threat-zones";
import L from "leaflet";
import { GeoJSON, Popup } from "react-leaflet";
import { useMemo } from "react";

const ZONE_STYLES: Record<ThreatZone["type"], { color: string; fillColor: string; fillOpacity: number; weight: number; dashArray?: string }> = {
  occupied: { color: "#991b1b", fillColor: "#dc2626", fillOpacity: 0.2, weight: 2 },
  contested: { color: "#c2410c", fillColor: "#f97316", fillOpacity: 0.15, weight: 2, dashArray: "6 4" },
  alert: { color: "#b91c1c", fillColor: "#ef4444", fillOpacity: 0.25, weight: 2, dashArray: "4 4" },
  danger: { color: "#a16207", fillColor: "#eab308", fillOpacity: 0.15, weight: 2, dashArray: "8 4" },
};

const SEVERITY_LABELS: Record<ThreatZone["severity"], string> = {
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
  critical: "Critical",
};

export function ThreatZonesLayer() {
  const { data: zones } = useThreatZones();

  const geoJsonData = useMemo(() => {
    if (!zones || zones.length === 0) return null;
    return {
      type: "FeatureCollection" as const,
      features: zones.map((zone) => ({
        type: "Feature" as const,
        properties: {
          id: zone.id,
          name: zone.name,
          zoneType: zone.type,
          severity: zone.severity,
          source: zone.source,
          updatedAt: zone.updatedAt,
        },
        geometry: zone.geometry,
      })),
    };
  }, [zones]);

  if (!geoJsonData) return null;

  return (
    <GeoJSON
      key={JSON.stringify(zones?.map((z) => z.id))}
      data={geoJsonData}
      style={(feature) => {
        const zoneType = feature?.properties?.zoneType as ThreatZone["type"];
        return ZONE_STYLES[zoneType] ?? ZONE_STYLES.danger;
      }}
      onEachFeature={(feature, layer) => {
        const props = feature.properties;
        const severity = SEVERITY_LABELS[props.severity as ThreatZone["severity"]] ?? props.severity;
        const typeLabel = props.zoneType.charAt(0).toUpperCase() + props.zoneType.slice(1);
        const time = props.updatedAt
          ? new Date(props.updatedAt).toLocaleString("uk-UA", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })
          : "";

        layer.bindPopup(
          `<div style="min-width:160px">
            <strong>${props.name}</strong><br/>
            <span style="font-size:11px;color:#666">Type: ${typeLabel}</span><br/>
            <span style="font-size:11px;color:#666">Severity: <b>${severity}</b></span><br/>
            <span style="font-size:10px;color:#999">Source: ${props.source}</span><br/>
            ${time ? `<span style="font-size:10px;color:#999">Updated: ${time}</span>` : ""}
          </div>`,
        );
      }}
    />
  );
}
