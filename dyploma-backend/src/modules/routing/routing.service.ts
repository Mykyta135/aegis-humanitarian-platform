import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { decode } = require('@googlemaps/polyline-codec') as {
  decode: (encoded: string, precision?: number) => [number, number][];
};

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface SnappedCoordinate extends Coordinate {
  /** Distance in metres from the original coordinate to the snapped road point */
  distanceM: number;
  /** Whether this coordinate was snapped (original was off-road) */
  wasSnapped: boolean;
}

export interface RouteAlternative {
  id: string;
  profile: string;
  label: string;
  safetyTag: string;
  route: string;
  distanceKm: number;
  durationMin: number;
  safetyScore: number; // 0-100, higher = safer
  threatExposure: { zoneName: string; severity: string }[];
  recommended: boolean;
}

export interface RouteResult {
  /** Encoded polyline geometry (null if no route could be found at all) */
  route: string | null;
  /** Start coordinate, possibly snapped to nearest road */
  snappedStart: SnappedCoordinate;
  /** End coordinate, possibly snapped to nearest road */
  snappedEnd: SnappedCoordinate;
}

export interface RouteConditions {
  /** Avoid passing through threat zone polygons */
  avoidThreatZones: boolean;
  /** none | light | heavy — light/heavy add unpaved/ferry avoidance */
  weatherSeverity: 'none' | 'light' | 'heavy';
  /** Avoid unpaved roads */
  avoidUnpaved: boolean;
  /** Night mode — prefer driving-car but flag */
  nightMode: boolean;
  /** Vehicle load — heavy uses driving-hgv profile */
  vehicleLoad: 'light' | 'standard' | 'heavy';
}

export interface ConditionedRouteResult {
  route: string | null;
  profile: string;
  distanceKm: number;
  durationMin: number;
  avoidFeatures: string[];
  conditionSummary: string[];
}

// ORS error code: no routable point within search radius
const ORS_UNROUTABLE = 2010;
// Other permanent coordinate errors
const ORS_PERMANENT_ERRORS = new Set([ORS_UNROUTABLE, 2009, 2003]);
// Snap search radii in metres — each step doubles roughly
const SNAP_RADII_M = [350, 500, 750, 1000, 1500, 2000, 3500, 5000];

/** Haversine distance in metres between two lat/lng points */
function haversineM(a: Coordinate, b: Coordinate): number {
  const R = 6_371_000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openrouteservice.org';

  /** In-memory route cache: key = "lat,lng|lat,lng" → RouteResult, TTL = 24h */
  private readonly routeCache = new Map<string, { data: RouteResult; ts: number }>();
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  private cacheKey(start: Coordinate, end: Coordinate): string {
    return `${start.lat.toFixed(5)},${start.lng.toFixed(5)}|${end.lat.toFixed(5)},${end.lng.toFixed(5)}`;
  }

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('OPENROUTESERVICE_API_KEY')!;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Returns multiple route alternatives across different ORS profiles
   * (driving-car, cycling-road, foot-walking) plus alternative routes
   * within the driving-car profile if available.
   */
  async getRouteAlternatives(
    start: Coordinate,
    end: Coordinate,
    threatZones?: { name: string; severity: string; geometry: { type: string; coordinates: number[][][] } }[],
  ): Promise<RouteAlternative[]> {
    const rawAlts: Omit<RouteAlternative, 'safetyScore' | 'threatExposure' | 'recommended'>[] = [];

    // Driving with alternatives
    try {
      const drivingAlts = await this.fetchAlternatives(start, end, 'driving-car');
      drivingAlts.forEach((r, i) => {
        rawAlts.push({
          id: `driving-${i}`,
          profile: 'driving-car',
          label: i === 0 ? 'Driving (Primary)' : `Driving (Alt ${i})`,
          safetyTag: i === 0 ? 'standard' : 'alternative',
          route: r.geometry,
          distanceKm: Math.round(r.summary.distance / 10) / 100,
          durationMin: Math.round(r.summary.duration / 60),
        });
      });
    } catch (e) {
      this.logger.warn(`Driving alternatives failed: ${e.message}`);
    }

    // Other profiles
    for (const p of [
      { profile: 'cycling-road', label: 'Cycling', safetyTag: 'low-profile' },
      { profile: 'foot-walking', label: 'On Foot', safetyTag: 'stealth' },
    ]) {
      try {
        const route = await this.fetchSingleRoute(start, end, p.profile);
        if (route) {
          rawAlts.push({
            id: p.profile,
            profile: p.profile,
            label: p.label,
            safetyTag: p.safetyTag,
            route: route.geometry,
            distanceKm: Math.round(route.summary.distance / 10) / 100,
            durationMin: Math.round(route.summary.duration / 60),
          });
        }
      } catch (e) {
        this.logger.warn(`${p.profile} route failed: ${e.message}`);
      }
    }

    // Score each route against threat zones
    const results: RouteAlternative[] = rawAlts.map((alt) => {
      const { score, exposure } = this.scoreSafety(alt.route, threatZones ?? []);
      return { ...alt, safetyScore: score, threatExposure: exposure, recommended: false };
    });

    // Mark the best route as recommended (highest safety, then shortest duration)
    if (results.length > 0) {
      results.sort((a, b) => b.safetyScore - a.safetyScore || a.durationMin - b.durationMin);
      results[0].recommended = true;
      // Re-sort by profile order for display
      const profileOrder = ['driving-car', 'cycling-road', 'foot-walking'];
      results.sort((a, b) => {
        if (a.recommended && !b.recommended) return -1;
        if (!a.recommended && b.recommended) return 1;
        return profileOrder.indexOf(a.profile) - profileOrder.indexOf(b.profile);
      });
    }

    return results;
  }

  /**
   * Score a route's safety by checking how many of its points fall inside threat zones.
   * Returns a score 0–100 (100 = no exposure) and a list of zones the route passes through.
   */
  private scoreSafety(
    encodedRoute: string,
    zones: { name: string; severity: string; geometry: { type: string; coordinates: number[][][] } }[],
  ): { score: number; exposure: { zoneName: string; severity: string }[] } {
    if (!zones.length) return { score: 100, exposure: [] };

    const points = decode(encodedRoute) as [number, number][];
    // Sample every Nth point for performance
    const sampleStep = Math.max(1, Math.floor(points.length / 50));
    const sampled = points.filter((_, i) => i % sampleStep === 0);

    const exposure: { zoneName: string; severity: string }[] = [];
    let totalPenalty = 0;
    const severityWeight: Record<string, number> = { low: 1, medium: 2, high: 4, critical: 8 };

    for (const zone of zones) {
      if (zone.geometry.type !== 'Polygon') continue;
      const polygon = zone.geometry.coordinates[0]; // outer ring: [lng, lat][]

      let pointsInside = 0;
      for (const [lat, lng] of sampled) {
        if (this.pointInPolygon(lng, lat, polygon)) {
          pointsInside++;
        }
      }

      if (pointsInside > 0) {
        const fraction = pointsInside / sampled.length;
        const weight = severityWeight[zone.severity] ?? 2;
        totalPenalty += fraction * weight * 15; // penalty scaled by severity
        exposure.push({ zoneName: zone.name, severity: zone.severity });
      }
    }

    const score = Math.max(0, Math.round(100 - totalPenalty));
    return { score, exposure };
  }

  /** Ray-casting point-in-polygon test */
  private pointInPolygon(x: number, y: number, polygon: number[][]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  /**
   * Compute a route adjusted for field conditions.
   * Conditions map to real ORS parameters:
   *  - avoidThreatZones → options.avoid_polygons (GeoJSON MultiPolygon)
   *  - avoidUnpaved / weatherSeverity=heavy → options.avoid_features: ["unpavedroads"]
   *  - weatherSeverity=heavy → also avoid ferries
   *  - vehicleLoad=heavy → use driving-hgv profile
   *  - nightMode → driving-car but noted in summary
   */
  async getConditionedRoute(
    start: Coordinate,
    end: Coordinate,
    conditions: RouteConditions,
    threatZonePolygons?: number[][][][],
  ): Promise<ConditionedRouteResult> {
    const avoidFeatures: string[] = [];
    const conditionSummary: string[] = [];

    if (conditions.avoidUnpaved || conditions.weatherSeverity === 'heavy') {
      avoidFeatures.push('unpavedroads');
      conditionSummary.push('Avoiding unpaved roads');
    }
    if (conditions.weatherSeverity === 'heavy') {
      avoidFeatures.push('ferries');
      conditionSummary.push('Heavy rain — ferries excluded');
    }
    if (conditions.weatherSeverity === 'light') {
      conditionSummary.push('Light rain — mud risk on unpaved roads');
    }
    if (conditions.nightMode) {
      conditionSummary.push('Night operation — reduced speed assumed');
    }
    if (conditions.vehicleLoad === 'heavy') {
      conditionSummary.push('Heavy vehicle — using HGV routing profile');
    }

    const profile = conditions.vehicleLoad === 'heavy' ? 'driving-hgv' : 'driving-car';

    // Build ORS options object
    const orsOptions: Record<string, any> = {};
    if (avoidFeatures.length > 0) {
      orsOptions.avoid_features = avoidFeatures;
    }
    if (conditions.avoidThreatZones && threatZonePolygons && threatZonePolygons.length > 0) {
      conditionSummary.push(`Routing around ${threatZonePolygons.length} threat zone(s)`);
      orsOptions.avoid_polygons = {
        type: 'MultiPolygon',
        coordinates: threatZonePolygons,
      };
    }

    const body: Record<string, any> = {
      coordinates: [
        [start.lng, start.lat],
        [end.lng, end.lat],
      ],
    };
    if (Object.keys(orsOptions).length > 0) {
      body.options = orsOptions;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/v2/directions/${profile}`,
          body,
          { headers: { Authorization: this.apiKey, 'Content-Type': 'application/json' } },
        ),
      );
      const r = response.data.routes?.[0];
      if (!r) {
        return { route: null, profile, distanceKm: 0, durationMin: 0, avoidFeatures, conditionSummary };
      }
      return {
        route: r.geometry,
        profile,
        distanceKm: Math.round(r.summary.distance / 10) / 100,
        durationMin: Math.round(r.summary.duration / 60),
        avoidFeatures,
        conditionSummary,
      };
    } catch (error) {
      this.logger.warn(`Conditioned route failed: ${JSON.stringify(error.response?.data ?? error.message)}`);
      return { route: null, profile, distanceKm: 0, durationMin: 0, avoidFeatures, conditionSummary };
    }
  }

  async getRoute(start: Coordinate, end: Coordinate): Promise<RouteResult> {
    // Check cache first
    const key = this.cacheKey(start, end);
    const cached = this.routeCache.get(key);
    if (cached && Date.now() - cached.ts < this.CACHE_TTL_MS) {
      this.logger.debug(`Cache hit for route ${key}`);
      return cached.data;
    }

    const result = await this.fetchRouteUncached(start, end);

    // Store in cache
    this.routeCache.set(key, { data: result, ts: Date.now() });
    return result;
  }

  private async fetchRouteUncached(start: Coordinate, end: Coordinate): Promise<RouteResult> {
    // Attempt direct route first
    const directResult = await this.attemptRoute(start, end);
    if (directResult !== null) {
      return {
        route: directResult,
        snappedStart: { ...start, distanceM: 0, wasSnapped: false },
        snappedEnd: { ...end, distanceM: 0, wasSnapped: false },
      };
    }

    // Direct route failed — snap both endpoints to nearest roads iteratively
    this.logger.log(
      `Direct route failed. Starting snap algorithm for ` +
      `start=(${start.lat},${start.lng}) end=(${end.lat},${end.lng})`,
    );

    const [snappedStart, snappedEnd] = await Promise.all([
      this.snapToRoad(start),
      this.snapToRoad(end),
    ]);

    // Retry route with snapped coordinates
    const snappedResult = await this.attemptRoute(snappedStart, snappedEnd);

    return {
      route: snappedResult,
      snappedStart,
      snappedEnd,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Try a direct ORS directions call. Returns encoded polyline or null on permanent error. */
  private async attemptRoute(
    start: Coordinate,
    end: Coordinate,
  ): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/v2/directions/driving-car`,
          {
            coordinates: [
              [start.lng, start.lat],
              [end.lng, end.lat],
            ],
          },
          { headers: { Authorization: this.apiKey, 'Content-Type': 'application/json' } },
        ),
      );
      return response.data.routes[0]?.geometry ?? null;
    } catch (error) {
      const code: number | undefined = error.response?.data?.error?.code;

      if (code !== undefined && ORS_PERMANENT_ERRORS.has(code)) {
        this.logger.warn(
          `ORS permanent error [${code}]: ${error.response?.data?.error?.message}`,
        );
        return null; // signal caller to try snapping
      }

      // Transient / unexpected — bubble up
      this.logger.error(`ORS route request failed: ${JSON.stringify(error.response?.data ?? error.message)}`);
      throw new ServiceUnavailableException('Route calculation failed. Please try again.');
    }
  }

  /**
   * Iteratively expand the search radius until ORS /snap returns a routable point.
   * Falls back to the original coordinate if nothing is found within 5 km.
   */
  private async snapToRoad(original: Coordinate): Promise<SnappedCoordinate> {
    for (const radius of SNAP_RADII_M) {
      const snapped = await this.callSnapApi(original, radius);
      if (snapped) {
        const distanceM = Math.round(haversineM(original, snapped));
        const wasSnapped = distanceM > 5; // treat < 5m as "already on road"
        this.logger.log(
          `Snapped (${original.lat},${original.lng}) → (${snapped.lat},${snapped.lng}) ` +
          `within ${radius}m radius. Distance: ${distanceM}m`,
        );
        return { ...snapped, distanceM, wasSnapped };
      }
      this.logger.debug(`No snap point within ${radius}m, expanding radius…`);
    }

    // Nothing found within 5 km — return original as-is
    this.logger.warn(
      `Could not snap (${original.lat},${original.lng}) to any road within 5 km. ` +
      `Returning original coordinate.`,
    );
    return { ...original, distanceM: 0, wasSnapped: false };
  }

  /** Fetch route with alternative_routes enabled (driving-car only) */
  private async fetchAlternatives(
    start: Coordinate,
    end: Coordinate,
    profile: string,
  ): Promise<{ geometry: string; summary: { distance: number; duration: number } }[]> {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/v2/directions/${profile}`,
        {
          coordinates: [
            [start.lng, start.lat],
            [end.lng, end.lat],
          ],
          alternative_routes: {
            target_count: 3,
            weight_factor: 1.6,
            share_factor: 0.6,
          },
        },
        { headers: { Authorization: this.apiKey, 'Content-Type': 'application/json' } },
      ),
    );
    return (response.data.routes ?? []).map((r: any) => ({
      geometry: r.geometry,
      summary: r.summary,
    }));
  }

  /** Fetch a single route for a given profile */
  private async fetchSingleRoute(
    start: Coordinate,
    end: Coordinate,
    profile: string,
  ): Promise<{ geometry: string; summary: { distance: number; duration: number } } | null> {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/v2/directions/${profile}`,
        {
          coordinates: [
            [start.lng, start.lat],
            [end.lng, end.lat],
          ],
        },
        { headers: { Authorization: this.apiKey, 'Content-Type': 'application/json' } },
      ),
    );
    const route = response.data.routes?.[0];
    if (!route) return null;
    return { geometry: route.geometry, summary: route.summary };
  }

  /** Call ORS /snap endpoint. Returns snapped coordinate or null if none found. */
  private async callSnapApi(
    coord: Coordinate,
    radiusM: number,
  ): Promise<Coordinate | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/v2/snap/driving-car/json`,
          {
            locations: [[coord.lng, coord.lat]],
            radius: radiusM,
          },
          { headers: { Authorization: this.apiKey, 'Content-Type': 'application/json' } },
        ),
      );

      const location = response.data?.locations?.[0];
      if (!location || location.snapped_distance === undefined) return null;

      return { lat: location.location[1], lng: location.location[0] };
    } catch (error) {
      const code: number | undefined = error.response?.data?.error?.code;
      // 2010 from snap = still nothing found at this radius — continue expanding
      if (code === ORS_UNROUTABLE) return null;
      // Any other error — log and bail, we'll fall back to original
      this.logger.warn(`ORS snap request failed: ${JSON.stringify(error.response?.data ?? error.message)}`);
      return null;
    }
  }
}
