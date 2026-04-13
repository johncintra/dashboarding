import { DashboardPayload } from "@/lib/api/types";
import { mockDashboardData } from "@/lib/api/mock-data";

const DEFAULT_ENDPOINT = "/api/dashboard";
const DASHBOARD_REQUEST_TIMEOUT_MS = 50_000;

export async function fetchDashboardData(
  endpoint = process.env.NEXT_PUBLIC_DASHBOARD_API_URL || DEFAULT_ENDPOINT,
): Promise<DashboardPayload> {
  if (!endpoint) {
    return mockDashboardData;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, DASHBOARD_REQUEST_TIMEOUT_MS);

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    signal: controller.signal,
  }).finally(() => {
    window.clearTimeout(timeoutId);
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar os dados da dashboard.");
  }

  return (await response.json()) as DashboardPayload;
}
