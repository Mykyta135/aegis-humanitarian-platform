"use client";

import L from "leaflet";
import { FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";

interface MapDrawControlProps {
  onAreaSelected: (bounds: L.LatLngBounds) => void;
  onSelectionCleared: () => void;
}

export function MapDrawControl({
  onAreaSelected,
  onSelectionCleared,
}: MapDrawControlProps) {
  return (
    <FeatureGroup>
      <EditControl
        position="topleft"
        onCreated={(e: any) => onAreaSelected(e.layer.getBounds())}
        onDeleted={onSelectionCleared}
        draw={{
          polygon: false,
          polyline: false,
          marker: false,
          circlemarker: false,
          rectangle: { shapeOptions: { color: "#2563eb" } },
          circle: { shapeOptions: { color: "#2563eb" } },
        }}
        edit={{ edit: false }}
      />
    </FeatureGroup>
  );
}
