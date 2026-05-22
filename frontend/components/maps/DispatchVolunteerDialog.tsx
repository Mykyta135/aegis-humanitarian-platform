"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVolunteers } from "@/hooks/use-volunteers";
import { useMissionWizardStore } from "@/stores/use-mission-wizard.store";
import L from "leaflet";
import { UserCheck } from "lucide-react";

interface Props {
  open: boolean;
  latLng: L.LatLng | null;
  onClose: () => void;
}

export function DispatchVolunteerDialog({ open, latLng, onClose }: Props) {
  const { data: volunteers = [] } = useVolunteers({});
  const { openWizard } = useMissionWizardStore();

  const available = volunteers.filter((v) => v.status === "available");

  const handleDispatch = (volunteerId: string) => {
    if (!latLng) return;
    openWizard(latLng, volunteerId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Dispatch Volunteer</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-2">
          Select an available volunteer to dispatch to{" "}
          {latLng ? `${latLng.lat.toFixed(4)}, ${latLng.lng.toFixed(4)}` : "this location"}.
        </p>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {available.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No available volunteers.</p>
          )}
          {available.map((v) => (
            <button
              key={v.id}
              onClick={() => handleDispatch(v.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md border hover:bg-accent text-left transition-colors"
            >
              <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">{v.name}</p>
                <p className="text-xs text-muted-foreground">
                  {v.experienceLevel ?? "volunteer"} · {v.skills.slice(0, 3).join(", ")}
                </p>
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Selecting a volunteer opens the mission wizard pre-filled with the location.
        </p>
      </DialogContent>
    </Dialog>
  );
}
