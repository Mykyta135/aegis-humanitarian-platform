import L from "leaflet";
import { create } from "zustand";

export type PickingMode = "none" | "end";

interface WizardState {
  isOpen: boolean;
  startLatLng: L.LatLng | null;
  endLatLng: L.LatLng | null;
  geocodedLatLng: L.LatLng | null;
  geocodedLabel: string | null;
  preselectedVolunteerId: string | null;
  pickingMode: PickingMode;
  openWizard: (latLng?: L.LatLng, volunteerId?: string) => void;
  closeWizard: () => void;
  setEndLatLng: (latLng: L.LatLng) => void;
  setGeocodedLatLng: (latLng: L.LatLng, label: string) => void;
  startPickingEnd: () => void;
  stopPicking: () => void;
}

export const useMissionWizardStore = create<WizardState>((set) => ({
  isOpen: false,
  startLatLng: null,
  endLatLng: null,
  geocodedLatLng: null,
  geocodedLabel: null,
  preselectedVolunteerId: null,
  pickingMode: "none",
  openWizard: (latLng, volunteerId) => set({ isOpen: true, startLatLng: latLng || null, endLatLng: null, geocodedLatLng: null, geocodedLabel: null, preselectedVolunteerId: volunteerId || null, pickingMode: "none" }),
  closeWizard: () => set({ isOpen: false, startLatLng: null, endLatLng: null, geocodedLatLng: null, geocodedLabel: null, preselectedVolunteerId: null, pickingMode: "none" }),
  setEndLatLng: (latLng) => set({ endLatLng: latLng, pickingMode: "none" }),
  setGeocodedLatLng: (latLng, label) => set({ geocodedLatLng: latLng, geocodedLabel: label }),
  startPickingEnd: () => set({ pickingMode: "end" }),
  stopPicking: () => set({ pickingMode: "none" }),
}));
