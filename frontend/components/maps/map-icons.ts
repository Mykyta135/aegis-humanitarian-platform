import L from "leaflet";

// ---------------------------------------------------------------------------
// Helper: build a DivIcon from an SVG string
// ---------------------------------------------------------------------------
function svgIcon(svg: string, size = 32): L.DivIcon {
  return new L.DivIcon({
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    className: "", // prevent leaflet's white-box default
  });
}

// ---------------------------------------------------------------------------
// Mission start / end markers (keep colour-coded pins from before)
// ---------------------------------------------------------------------------
function pinIcon(color: string): L.DivIcon {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z"
          fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="#fff" fill-opacity="0.85"/>
  </svg>`;
  return new L.DivIcon({
    html: svg,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
    className: "",
  });
}

export const missionStartIcons: Record<string, L.DivIcon> = {
  pending: pinIcon("#eab308"),     // yellow
  in_progress: pinIcon("#f97316"), // orange
};
export const missionEndIcon = pinIcon("#22c55e"); // green

// ---------------------------------------------------------------------------
// Volunteer icons — circular badge with an avatar-person glyph
// Colour encodes status: blue=available, orange=on_mission, grey=unavailable
// ---------------------------------------------------------------------------
function volunteerSvg(bg: string, label = ""): string {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">
    <circle cx="18" cy="18" r="17" fill="${bg}" stroke="#fff" stroke-width="2"/>
    <!-- person silhouette -->
    <circle cx="18" cy="13" r="5" fill="#fff"/>
    <path d="M8 30c0-5.523 4.477-10 10-10s10 4.477 10 10" fill="#fff"/>
    ${label ? `<text x="18" y="34" text-anchor="middle" font-size="7" fill="${bg}" font-family="sans-serif" font-weight="bold">${label}</text>` : ""}
  </svg>`;
}

export const volunteerIcons = {
  available: svgIcon(volunteerSvg("#3b82f6")),        // blue
  on_mission: svgIcon(volunteerSvg("#f97316")),       // orange
  unavailable: svgIcon(volunteerSvg("#6b7280")),      // grey
};

// Default fallback
export const volunteerIcon = volunteerIcons.available;

// ---------------------------------------------------------------------------
// Resource icons — square badge with a type-specific glyph
// ---------------------------------------------------------------------------
function resourceSvg(bg: string, glyph: string): string {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">
    <rect x="1" y="1" width="34" height="34" rx="6" fill="${bg}" stroke="#fff" stroke-width="2"/>
    <text x="18" y="24" text-anchor="middle" font-size="18" font-family="serif">${glyph}</text>
  </svg>`;
}

export const resourceIcons: Record<string, L.DivIcon> = {
  vehicle:     svgIcon(resourceSvg("#0ea5e9", "🚗")),
  generator:   svgIcon(resourceSvg("#a855f7", "⚡")),
  drone:       svgIcon(resourceSvg("#06b6d4", "🚁")),
  medical_kit: svgIcon(resourceSvg("#ef4444", "➕")),
};

// Default grey square for unknown types
export const resourceIcon = svgIcon(resourceSvg("#6b7280", "📦"));

export function getResourceIcon(type?: string): L.DivIcon {
  return (type ? resourceIcons[type] : undefined) ?? resourceIcon;
}

export function getVolunteerIcon(status?: string): L.DivIcon {
  return (status ? volunteerIcons[status as keyof typeof volunteerIcons] : undefined) ?? volunteerIcon;
}

// ---------------------------------------------------------------------------
// Mission icons — diamond shape, colour = priority, glyph = status
// ---------------------------------------------------------------------------
function missionSvg(bg: string, glyph: string): string {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">
    <polygon points="18,2 34,18 18,34 2,18" fill="${bg}" stroke="#fff" stroke-width="2"/>
    <text x="18" y="23" text-anchor="middle" font-size="14" font-family="serif">${glyph}</text>
  </svg>`;
}

const MISSION_GLYPHS: Record<string, string> = {
  pending: "⏳",
  in_progress: "▶",
  completed: "✓",
  cancelled: "✕",
};

const MISSION_PRIORITY_BG: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

export function getMissionIcon(status: string, priority?: string): L.DivIcon {
  const bg = MISSION_PRIORITY_BG[priority ?? ""] ?? "#6b7280";
  const glyph = MISSION_GLYPHS[status] ?? "?";
  return svgIcon(missionSvg(bg, glyph));
}
