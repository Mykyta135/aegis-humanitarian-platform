"use client";

import { TileLayer } from "react-leaflet";

/**
 * OpenWeatherMap free tile layers for precipitation and clouds.
 * Uses the free OWM tile API (no key required for basic layers).
 * For production, set NEXT_PUBLIC_OWM_API_KEY in env.
 */
export function WeatherPrecipitationLayer() {
  const apiKey = process.env.NEXT_PUBLIC_OWM_API_KEY ?? "";
  if (!apiKey) return null;

  return (
    <TileLayer
      url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`}
      opacity={0.5}
      attribution='&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>'
    />
  );
}

export function WeatherCloudsLayer() {
  const apiKey = process.env.NEXT_PUBLIC_OWM_API_KEY ?? "";
  if (!apiKey) return null;

  return (
    <TileLayer
      url={`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`}
      opacity={0.4}
      attribution='&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>'
    />
  );
}
