import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

export interface ThreatZone {
  id: string;
  name: string;
  type: 'occupied' | 'contested' | 'alert' | 'danger';
  severity: 'low' | 'medium' | 'high' | 'critical';
  geometry: { type: string; coordinates: number[][][] };
  source: string;
  updatedAt: string;
}

interface AlertsUaRegion {
  id: string;
  name: string;
  name_en: string;
  alert: boolean;
  changed: string;
}

// Pre-defined conflict/danger zones for Ukrainian regions frequently under threat.
// In production these would come from DeepStateMap's GeoJSON API.
const STATIC_THREAT_ZONES: ThreatZone[] = [
  {
    id: 'zone-donetsk-front',
    name: 'Donetsk Frontline Zone',
    type: 'contested',
    severity: 'critical',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [37.5, 48.8], [38.2, 48.8], [38.5, 48.4],
        [38.3, 47.9], [37.8, 47.7], [37.2, 48.0],
        [37.0, 48.4], [37.5, 48.8],
      ]],
    },
    source: 'DeepStateMap (static)',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'zone-luhansk',
    name: 'Luhansk Occupied Territory',
    type: 'occupied',
    severity: 'high',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [38.5, 49.2], [39.8, 49.2], [40.0, 48.6],
        [39.5, 48.2], [38.8, 48.3], [38.3, 48.7],
        [38.5, 49.2],
      ]],
    },
    source: 'DeepStateMap (static)',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'zone-zaporizhzhia-south',
    name: 'Zaporizhzhia Southern Sector',
    type: 'contested',
    severity: 'high',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [35.0, 47.4], [36.0, 47.4], [36.2, 47.0],
        [35.8, 46.7], [35.2, 46.7], [34.8, 47.0],
        [35.0, 47.4],
      ]],
    },
    source: 'DeepStateMap (static)',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'zone-kherson-east',
    name: 'Kherson East Bank',
    type: 'danger',
    severity: 'high',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [33.5, 46.8], [34.2, 46.8], [34.5, 46.4],
        [34.0, 46.1], [33.3, 46.2], [33.2, 46.5],
        [33.5, 46.8],
      ]],
    },
    source: 'DeepStateMap (static)',
    updatedAt: new Date().toISOString(),
  },
];

// Ukrainian regions with approximate center coordinates for air-raid alert zones
const REGION_CENTERS: Record<string, { lat: number; lng: number; radiusKm: number }> = {
  'Харківська область': { lat: 49.99, lng: 36.23, radiusKm: 60 },
  'Донецька область': { lat: 48.02, lng: 37.80, radiusKm: 50 },
  'Запорізька область': { lat: 47.84, lng: 35.14, radiusKm: 50 },
  'Херсонська область': { lat: 46.63, lng: 32.62, radiusKm: 50 },
  'Луганська область': { lat: 48.57, lng: 39.31, radiusKm: 50 },
  'Миколаївська область': { lat: 46.97, lng: 32.00, radiusKm: 40 },
  'Дніпропетровська область': { lat: 48.46, lng: 35.05, radiusKm: 40 },
  'Київська область': { lat: 50.45, lng: 30.52, radiusKm: 40 },
  'Сумська область': { lat: 50.91, lng: 34.80, radiusKm: 40 },
  'Чернігівська область': { lat: 51.49, lng: 31.29, radiusKm: 35 },
  'Одеська область': { lat: 46.48, lng: 30.73, radiusKm: 40 },
  'Полтавська область': { lat: 49.59, lng: 34.55, radiusKm: 35 },
  'Вінницька область': { lat: 49.23, lng: 28.47, radiusKm: 30 },
  'Житомирська область': { lat: 50.25, lng: 28.66, radiusKm: 30 },
  'Кіровоградська область': { lat: 48.51, lng: 32.26, radiusKm: 30 },
  'Черкаська область': { lat: 49.44, lng: 32.06, radiusKm: 30 },
  'Хмельницька область': { lat: 49.42, lng: 27.00, radiusKm: 25 },
  'Рівненська область': { lat: 50.62, lng: 26.25, radiusKm: 25 },
  'Волинська область': { lat: 50.75, lng: 25.33, radiusKm: 25 },
  'Тернопільська область': { lat: 49.55, lng: 25.59, radiusKm: 25 },
  'Івано-Франківська область': { lat: 48.92, lng: 24.71, radiusKm: 25 },
  'Львівська область': { lat: 49.84, lng: 24.03, radiusKm: 30 },
  'Закарпатська область': { lat: 48.62, lng: 22.29, radiusKm: 25 },
  'Чернівецька область': { lat: 48.29, lng: 25.94, radiusKm: 20 },
  'м. Київ': { lat: 50.45, lng: 30.52, radiusKm: 20 },
};

/** Generate a rough circle polygon from center + radius */
function circlePolygon(
  center: { lat: number; lng: number },
  radiusKm: number,
  sides = 32,
): { type: string; coordinates: number[][][] } {
  const coords: [number, number][] = [];
  for (let i = 0; i <= sides; i++) {
    const angle = (2 * Math.PI * i) / sides;
    const dLat = (radiusKm / 111.32) * Math.sin(angle);
    const dLng = (radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180))) * Math.cos(angle);
    coords.push([center.lng + dLng, center.lat + dLat]);
  }
  return { type: 'Polygon', coordinates: [coords] };
}

@Injectable()
export class ThreatZonesService {
  private readonly logger = new Logger(ThreatZonesService.name);
  private cachedAlerts: ThreatZone[] = [];
  private lastAlertFetch = 0;
  private readonly ALERT_CACHE_TTL_MS = 60_000; // 1 minute

  constructor(private readonly httpService: HttpService) {}

  async getThreatZones(): Promise<ThreatZone[]> {
    const alerts = await this.fetchActiveAlerts();
    return [...STATIC_THREAT_ZONES, ...alerts];
  }

  private async fetchActiveAlerts(): Promise<ThreatZone[]> {
    if (Date.now() - this.lastAlertFetch < this.ALERT_CACHE_TTL_MS) {
      return this.cachedAlerts;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get('https://alerts.in.ua/api/states', {
          headers: { 'Accept': 'application/json' },
          timeout: 5000,
        }),
      );

      const states: AlertsUaRegion[] = response.data?.states ?? response.data ?? [];
      const activeAlerts = states.filter((s) => s.alert);

      this.cachedAlerts = activeAlerts
        .map((region): ThreatZone | null => {
          const center = REGION_CENTERS[region.name];
          if (!center) return null;

          return {
            id: `alert-${region.id}`,
            name: `Air Raid Alert: ${region.name_en || region.name}`,
            type: 'alert',
            severity: 'critical',
            geometry: circlePolygon(center, center.radiusKm),
            source: 'alerts.in.ua',
            updatedAt: region.changed,
          };
        })
        .filter((z): z is ThreatZone => z !== null);

      this.lastAlertFetch = Date.now();
      this.logger.log(`Fetched ${this.cachedAlerts.length} active air raid alerts`);
    } catch (error) {
      this.logger.warn(`Failed to fetch alerts.in.ua: ${error.message}. Using cached data.`);
    }

    return this.cachedAlerts;
  }
}
