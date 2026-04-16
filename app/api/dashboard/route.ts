import { NextResponse } from "next/server";

import { mockDashboardData } from "@/lib/api/mock-data";
import {
  parseDashboardSpreadsheet,
  parseDashboardSpreadsheetBuffer,
} from "@/lib/api/spreadsheet";
import { DashboardPayload } from "@/lib/api/types";

const EXTERNAL_REQUEST_TIMEOUT_MS = 45_000;
const SERVER_CACHE_TTL_MS = 60_000;
const STALE_CACHE_MAX_MS = 90_000;

let cachedExternalPayload: DashboardPayload | null = null;
let cachedExternalPayloadAt = 0;

function isValidDashboardPayload(payload: unknown): payload is DashboardPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<DashboardPayload> & { ok?: boolean; error?: string };

  if (candidate.ok === false) {
    return false;
  }

  if (!candidate.summary || !candidate.series || !candidate.daily || !candidate.insights) {
    return false;
  }

  return (
    typeof candidate.summary.current === "number" &&
    typeof candidate.summary.previous1 === "number" &&
    typeof candidate.summary.previous2 === "number" &&
    typeof candidate.summary.growth_vs_previous1 === "number" &&
    typeof candidate.summary.growth_vs_previous2 === "number" &&
    typeof candidate.summary.growth_vs_average === "number" &&
    Array.isArray(candidate.series) &&
    Array.isArray(candidate.daily) &&
    Array.isArray(candidate.insights)
  );
}

async function fetchWithTimeout(input: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, EXTERNAL_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildNoCacheUrl(url: string) {
  const parsedUrl = new URL(url);
  parsedUrl.searchParams.set("_ts", Date.now().toString());
  return parsedUrl.toString();
}

function withExternalMeta(
  payload: DashboardPayload,
  overrides?: Partial<NonNullable<DashboardPayload["meta"]>>,
): DashboardPayload {
  return {
    ...payload,
    meta: {
      ...(payload.meta ?? {}),
      source: "external-json",
      fetched_at: new Date().toISOString(),
      ...overrides,
    },
  };
}

function withSpreadsheetMeta(
  payload: DashboardPayload,
  overrides?: Partial<NonNullable<DashboardPayload["meta"]>>,
): DashboardPayload {
  return {
    ...payload,
    meta: {
      ...(payload.meta ?? {}),
      source: "spreadsheet",
      fetched_at: new Date().toISOString(),
      ...overrides,
    },
  };
}

function mergeCurveData(
  basePayload: DashboardPayload,
  curvePayload: DashboardPayload,
): DashboardPayload {
  return {
    ...basePayload,
    series: curvePayload.series,
    daily: curvePayload.daily,
    meta: {
      source: basePayload.meta?.source ?? "external-json",
      ...(basePayload.meta ?? {}),
      current_elapsed_hours: curvePayload.meta?.current_elapsed_hours,
      current_elapsed_days: curvePayload.meta?.current_elapsed_days,
      last_event_at: curvePayload.meta?.last_event_at,
    },
  };
}

function getCachedExternalPayload() {
  if (!cachedExternalPayload || !cachedExternalPayloadAt) {
    return null;
  }

  const ageMs = Date.now() - cachedExternalPayloadAt;
  if (ageMs <= SERVER_CACHE_TTL_MS) {
    return withExternalMeta(cachedExternalPayload, {
      cache_state: "fresh",
    });
  }

  return null;
}

function getStaleExternalPayload() {
  if (!cachedExternalPayload || !cachedExternalPayloadAt) {
    return null;
  }

  const ageMs = Date.now() - cachedExternalPayloadAt;
  if (ageMs <= STALE_CACHE_MAX_MS) {
    return withExternalMeta(cachedExternalPayload, {
      cache_state: "stale",
    });
  }

  return null;
}

export async function GET() {
  const jsonUrl = process.env.DASHBOARD_SOURCE_JSON_URL;
  const spreadsheetPath = process.env.SPREADSHEET_FILE_PATH;
  const spreadsheetXlsxUrl = process.env.GOOGLE_SHEETS_XLSX_URL;

  try {
    if (jsonUrl) {
      const freshCache = getCachedExternalPayload();
      if (freshCache) {
        return NextResponse.json(freshCache);
      }

      const response = await fetchWithTimeout(buildNoCacheUrl(jsonUrl), {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, max-age=0",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error("Não foi possível carregar o JSON externo da dashboard.");
      }

      const payload = await response.json();

      if (!isValidDashboardPayload(payload)) {
        throw new Error(
          "A API externa não retornou o formato esperado da dashboard.",
        );
      }

      const enrichedPayload = withExternalMeta(payload, {
        cache_state: "fresh",
      });

      let finalPayload = enrichedPayload;

      if (spreadsheetXlsxUrl) {
        try {
          const spreadsheetResponse = await fetchWithTimeout(spreadsheetXlsxUrl, {
            cache: "no-store",
          });

          if (spreadsheetResponse.ok) {
            const spreadsheetPayload = parseDashboardSpreadsheetBuffer(
              Buffer.from(await spreadsheetResponse.arrayBuffer()),
            );

            finalPayload = mergeCurveData(
              enrichedPayload,
              withSpreadsheetMeta(spreadsheetPayload, {
                cache_state: "fresh",
              }),
            );
          }
        } catch {
          finalPayload = enrichedPayload;
        }
      }

      cachedExternalPayload = finalPayload;
      cachedExternalPayloadAt = Date.now();

      return NextResponse.json(finalPayload);
    }

    if (spreadsheetXlsxUrl) {
      const response = await fetchWithTimeout(spreadsheetXlsxUrl, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Não foi possível baixar a planilha XLSX do Google Sheets.");
      }

      const payload = parseDashboardSpreadsheetBuffer(
        Buffer.from(await response.arrayBuffer()),
      );

      return NextResponse.json(
        withSpreadsheetMeta(payload, {
          cache_state: "fresh",
        }),
      );
    }

    if (spreadsheetPath) {
      const payload = parseDashboardSpreadsheet(spreadsheetPath);
      return NextResponse.json(payload);
    }

    return NextResponse.json({
      ...mockDashboardData,
      meta: {
        source: "mock",
      },
    });
  } catch (error) {
    const staleCache = getStaleExternalPayload();
    if (staleCache) {
      return NextResponse.json(
        withExternalMeta(staleCache, {
          fallback_reason:
            error instanceof Error
              ? error.message
              : "Falha inesperada ao carregar a dashboard.",
        }),
        {
          status: 200,
        },
      );
    }

    return NextResponse.json(
      {
        ...mockDashboardData,
        meta: {
          source: "mock",
          cache_state: "stale",
          fetched_at: new Date().toISOString(),
          fallback_reason:
            error instanceof Error
              ? error.message
              : "Falha inesperada ao carregar a dashboard.",
        },
      },
      {
        status: 200,
      },
    );
  }
}
