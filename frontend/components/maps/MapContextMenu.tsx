"use client";

import { useEffect, useRef } from "react";
import { MapPin, Siren, Truck, PackageSearch, UserCheck } from "lucide-react";
import L from "leaflet";

interface MapContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  latLng: L.LatLng | null;
  onClose: () => void;
  onCreateTask: (latLng: L.LatLng) => void;
  onRequestSupport?: (latLng: L.LatLng) => void;
  onDispatch?: (latLng: L.LatLng) => void;
  onViewResources?: (latLng: L.LatLng) => void;
}

export function MapContextMenu({
  isOpen,
  position,
  latLng,
  onClose,
  onCreateTask,
  onRequestSupport,
  onDispatch,
  onViewResources,
}: MapContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !latLng) return null;

  const coord = `${latLng.lat.toFixed(4)}, ${latLng.lng.toFixed(4)}`;

  const items = [
    {
      icon: <MapPin className="h-3.5 w-3.5" />,
      label: "Create mission here",
      sublabel: coord,
      onClick: () => { onCreateTask(latLng); onClose(); },
      disabled: false,
    },
    {
      icon: <Siren className="h-3.5 w-3.5" />,
      label: "Request support",
      sublabel: "Open mission wizard in support mode",
      onClick: () => { onRequestSupport ? onRequestSupport(latLng) : onCreateTask(latLng); onClose(); },
      disabled: false,
    },
    {
      icon: <UserCheck className="h-3.5 w-3.5" />,
      label: "Dispatch volunteer",
      sublabel: "Assign available volunteer to this location",
      onClick: () => { onDispatch ? onDispatch(latLng) : onCreateTask(latLng); onClose(); },
      disabled: false,
    },
    {
      icon: <PackageSearch className="h-3.5 w-3.5" />,
      label: "View nearby resources",
      sublabel: "Show resources within 10 km",
      onClick: () => { onViewResources ? onViewResources(latLng) : undefined; onClose(); },
      disabled: !onViewResources,
    },
    {
      icon: <Truck className="h-3.5 w-3.5" />,
      label: "Resource delivery mission",
      sublabel: "Create a mission to deliver a resource here",
      onClick: () => { onCreateTask(latLng); onClose(); },
      disabled: false,
    },
  ];

  return (
    <div
      ref={menuRef}
      style={{ position: "fixed", top: position.y, left: position.x, zIndex: 2000 }}
      className="w-60 bg-popover border rounded-lg shadow-lg overflow-hidden py-1 text-sm"
    >
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Map Actions
      </div>
      <div className="border-t mb-1" />
      {items.map((item) => (
        <button
          key={item.label}
          className={`w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors ${
            item.disabled
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-accent hover:text-accent-foreground cursor-pointer"
          }`}
          onClick={item.disabled ? undefined : item.onClick}
          disabled={item.disabled}
        >
          <span className="mt-0.5 shrink-0 text-muted-foreground">{item.icon}</span>
          <div>
            <div className="font-medium leading-tight">{item.label}</div>
            {item.sublabel && (
              <div className="text-[10px] text-muted-foreground mt-0.5">{item.sublabel}</div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
