"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { fetchDashboardData } from "@/lib/api/dashboard";
import { DashboardPayload } from "@/lib/api/types";

type UseDashboardDataResult = {
  data: DashboardPayload | null;
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: Date | null;
};

const REFRESH_INTERVAL_MS = 60_000;

export function useDashboardData(): UseDashboardDataResult {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const lastGoodDataRef = useRef<DashboardPayload | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async (silent = false) => {
      if (!silent && !lastGoodDataRef.current) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const payload = await fetchDashboardData();
        if (!isMounted) {
          return;
        }

        const shouldKeepCurrentData =
          Boolean(lastGoodDataRef.current) &&
          payload.meta?.source === "mock" &&
          Boolean(payload.meta?.fallback_reason) &&
          lastGoodDataRef.current?.meta?.source !== "mock";

        if (shouldKeepCurrentData) {
          setError(
            `A API ao vivo falhou na atualização, mas a dashboard manteve o último dado válido: ${payload.meta?.fallback_reason}`,
          );
          return;
        }

        startTransition(() => {
          setData(payload);
          lastGoodDataRef.current = payload;
          setError(null);
          const updatedAt = payload.meta?.fetched_at
            ? new Date(payload.meta.fetched_at)
            : new Date();
          setLastUpdated(updatedAt);
        });
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Falha inesperada ao carregar a dashboard.",
        );
      } finally {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    load(false);

    const intervalId = window.setInterval(() => {
      void load(true);
    }, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return useMemo(
    () => ({
      data,
      error,
      isLoading,
      isRefreshing,
      lastUpdated,
    }),
    [data, error, isLoading, isRefreshing, lastUpdated],
  );
}
