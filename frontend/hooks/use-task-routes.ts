"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { type RouteResult } from "@/hooks/use-task-route";

const REQUEST_DELAY_MS = 1200; // Increased to avoid rate limits
const STALE_MS = 24 * 60 * 60 * 1000; // 24 hours — routes rarely change
const LS_KEY = "aegis-route-cache";

/** Persist routes in localStorage so they survive page reloads */
function loadLsCache(): Record<string, { data: RouteResult; ts: number }> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLsCache(cache: Record<string, { data: RouteResult; ts: number }>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

async function fetchRoute(taskId: string): Promise<RouteResult> {
  const response = await api.get(`/tasks/${taskId}/route`);
  return response.data as RouteResult;
}

export function useTaskRoutes(taskIds: string[]) {
  const queryClient = useQueryClient();
  const [routeMap, setRouteMap] = useState<Record<string, RouteResult>>({});

  useEffect(() => {
    if (taskIds.length === 0) return;

    let cancelled = false;
    const lsCache = loadLsCache();
    const now = Date.now();

    // Immediately populate from localStorage cache
    const initialMap: Record<string, RouteResult> = {};
    for (const taskId of taskIds) {
      const lsEntry = lsCache[taskId];
      if (lsEntry && now - lsEntry.ts < STALE_MS) {
        initialMap[taskId] = lsEntry.data;
        // Also populate React Query cache
        queryClient.setQueryData(["taskRoute", taskId], lsEntry.data);
      }
    }
    if (Object.keys(initialMap).length > 0) {
      setRouteMap((prev) => ({ ...prev, ...initialMap }));
    }

    (async () => {
      for (const taskId of taskIds) {
        if (cancelled) break;

        // Skip if already loaded from LS or RQ cache
        if (initialMap[taskId]) continue;

        const queryKey = ["taskRoute", taskId];
        const cached = queryClient.getQueryState(queryKey);
        if (
          cached?.status === "success" &&
          cached.dataUpdatedAt &&
          now - cached.dataUpdatedAt < STALE_MS
        ) {
          setRouteMap((prev) => ({ ...prev, [taskId]: cached.data as RouteResult }));
          // Also save to LS
          lsCache[taskId] = { data: cached.data as RouteResult, ts: cached.dataUpdatedAt };
          continue;
        }

        try {
          const result = await fetchRoute(taskId);
          if (!cancelled) {
            queryClient.setQueryData(queryKey, result);
            setRouteMap((prev) => ({ ...prev, [taskId]: result }));
            lsCache[taskId] = { data: result, ts: Date.now() };
            saveLsCache(lsCache);
          }
        } catch {
          // Leave missing — dashed line fallback
        }

        await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
      }
    })();

    return () => { cancelled = true; };
  }, [taskIds.join(","), queryClient]); // eslint-disable-line react-hooks/exhaustive-deps

  return routeMap;
}
