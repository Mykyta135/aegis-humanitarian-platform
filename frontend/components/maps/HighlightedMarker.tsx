"use client";

import { Marker, useMap } from "react-leaflet";
import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import L from "leaflet";

interface HighlightedMarkerProps {
  id: string;
  position: L.LatLngExpression;
  icon: L.Icon | L.DivIcon;
  isHovered: boolean;
  onMarkerHover: (id: string | null) => void;
  children: React.ReactNode;
}

export const HighlightedMarker = forwardRef<L.Marker, HighlightedMarkerProps>(
  function HighlightedMarker({ id, position, icon, isHovered, onMarkerHover, children }, ref) {
    const internalRef = useRef<L.Marker>(null);
    const map = useMap();

    // Expose the internal marker ref to the parent via forwardRef
    useImperativeHandle(ref, () => internalRef.current!, []);

    useEffect(() => {
      const marker = internalRef.current;
      if (marker) {
        marker.setZIndexOffset(isHovered ? 1000 : 0);
        marker.setOpacity(isHovered ? 1.0 : 0.8);
      }
    }, [isHovered]);

    return (
      <Marker
        ref={internalRef}
        position={position}
        icon={icon as L.Icon}
        opacity={0.8}
        eventHandlers={{
          mouseover: () => onMarkerHover(id),
          mouseout: () => onMarkerHover(null),
          click: () => map.setView(position, map.getZoom()),
        }}
      >
        {children}
      </Marker>
    );
  }
);
