import { MissionRegion } from '../tasks/entities/task.entity';

// Define the shape of our coordinate objects
export interface Coordinates {
  lat: number;
  lng: number;
}

// Define the shape of a bounding box
type BoundingBox = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

// Approximate bounding boxes for Ukrainian regions.
const regionBoundingBoxes: Record<string, BoundingBox> = {
  [MissionRegion.KYIV]: {
    minLat: 49.8,
    maxLat: 51.0,
    minLng: 29.5,
    maxLng: 31.5,
  },
  [MissionRegion.KHARKIV]: {
    minLat: 48.5,
    maxLat: 50.5,
    minLng: 35.0,
    maxLng: 38.0,
  },
  [MissionRegion.DONETSK]: {
    minLat: 47.5,
    maxLat: 49.0,
    minLng: 36.5,
    maxLng: 38.5,
  },
  [MissionRegion.ZAPORIZHZHIA]: {
    minLat: 46.8,
    maxLat: 48.2,
    minLng: 34.5,
    maxLng: 37.0,
  },
  [MissionRegion.KHERSON]: {
    minLat: 46.0,
    maxLat: 47.5,
    minLng: 32.2,
    maxLng: 35.5,
  },
  [MissionRegion.LUHANSK]: {
    minLat: 48.0,
    maxLat: 50.0,
    minLng: 38.0,
    maxLng: 40.0,
  },
  // Add other regions from your enum here
};

// Helper function to check if a point is within a box
export const isPointInRegion = (
  point: Coordinates | null | undefined,
  region: MissionRegion,
): boolean => {
  const box = regionBoundingBoxes[region];
  if (!box || !point) {
    return false;
  }
  return (
    point.lat >= box.minLat &&
    point.lat <= box.maxLat &&
    point.lng >= box.minLng &&
    point.lng <= box.maxLng
  );
};
