export type DashboardSeriesPoint = {
  time: number;
  current: number;
  previous1: number;
  previous2: number;
};

export type DashboardDailyPoint = {
  day: number;
  current: number;
  previous1: number;
  previous2: number;
};

export type DashboardSummary = {
  current: number;
  previous1: number;
  previous2: number;
  growth_vs_previous1: number;
  growth_vs_previous2: number;
  growth_vs_average: number;
};

export type DashboardPayload = {
  summary: DashboardSummary;
  series: DashboardSeriesPoint[];
  daily: DashboardDailyPoint[];
  insights: string[];
  meta?: {
    source: "mock" | "spreadsheet" | "external-json";
    current_elapsed_hours?: number;
    current_elapsed_days?: number;
    last_event_at?: string | null;
    fallback_reason?: string;
    cache_state?: "fresh" | "stale";
    fetched_at?: string;
  };
};
