"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { MetricChip } from "@/components/ui/metric-chip";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { AccumulatedLineChart } from "@/components/charts/accumulated-line-chart";
import { ComparisonGauge } from "@/components/charts/comparison-gauge";
import { DailyBarChart } from "@/components/charts/daily-bar-chart";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatCompactNumber, formatPercent, formatWholeNumber } from "@/lib/utils/format";

type DashboardViewProps = {
  tvMode?: boolean;
};

const HISTORICAL_BEST_LEADS = 121560;
const HISTORICAL_BEST_LAUNCH = "L2602";
const CURRENT_CAPTURE_START_AT = "2026-04-13T05:00:00-03:00";

function LoadingDashboard({ tvMode = false }: DashboardViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
        <Skeleton className={tvMode ? "h-[220px]" : "h-[280px]"} />
        <Skeleton className={tvMode ? "h-[220px]" : "h-[280px]"} />
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[180px]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Skeleton className="h-[360px]" />
        <Skeleton className="h-[360px]" />
      </div>
    </div>
  );
}

function getComparisonCopy(value: number, label: string) {
  const direction = value >= 0 ? "acima" : "abaixo";
  return `O lançamento atual está ${formatPercent(Math.abs(value))} ${direction} do ${label} no mesmo ponto.`;
}

function getDeltaFooter(delta: number, label: string) {
  const direction = delta >= 0 ? "acima" : "abaixo";
  return `${formatWholeNumber(Math.abs(delta))} leads ${direction} do ${label}.`;
}

export function DashboardView({ tvMode = false }: DashboardViewProps) {
  const { data, error, isLoading, isRefreshing, lastUpdated } = useDashboardData();
  const [selectedCurveDay, setSelectedCurveDay] = useState<number | "all">("all");
  const [selectedDailyDay, setSelectedDailyDay] = useState<number | "all">("all");
  const safeLastUpdated = lastUpdated ?? Date.now();
  const currentElapsedHoursForFilter = Math.max(
    0,
    (new Date(safeLastUpdated).getTime() - new Date(CURRENT_CAPTURE_START_AT).getTime()) /
      (1000 * 60 * 60),
  );
  const currentElapsedDayForFilter = Math.max(1, Math.ceil(currentElapsedHoursForFilter / 24));
  const curveFilterDays = useMemo(
    () => Array.from({ length: currentElapsedDayForFilter }, (_, index) => index + 1),
    [currentElapsedDayForFilter],
  );
  const dailyFilterDays = useMemo(() => {
    const highestDailyDay = data?.daily?.length
      ? Math.max(...data.daily.map((item) => item.day))
      : 1;

    return Array.from({ length: highestDailyDay }, (_, index) => index + 1);
  }, [data?.daily]);

  if (isLoading) {
    return <LoadingDashboard tvMode={tvMode} />;
  }

  if (!data) {
    return <LoadingDashboard tvMode={tvMode} />;
  }

  const sourceLabel =
    data.meta?.source === "external-json"
      ? "Atualização"
      : data.meta?.source === "spreadsheet"
        ? "Planilha ao vivo"
        : "Mock local";
  const sourceTone =
    data.meta?.source === "mock"
      ? "warning"
      : "success";
  const fallbackReason = data.meta?.fallback_reason;
  const currentElapsedHours = data.meta?.current_elapsed_hours
    ?? Math.max(
      0,
      (new Date(lastUpdated ?? Date.now()).getTime() - new Date(CURRENT_CAPTURE_START_AT).getTime()) /
        (1000 * 60 * 60),
    );
  const insights = [
    getComparisonCopy(data.summary.growth_vs_previous1, "recente"),
    getComparisonCopy(data.summary.growth_vs_previous2, "último"),
    data.summary.current > HISTORICAL_BEST_LEADS
      ? `Uhulll, o lançamento atual se tornou o maior da história com ${formatWholeNumber(data.summary.current)} leads.`
      : `A maior captação histórica da empresa segue com ${formatWholeNumber(HISTORICAL_BEST_LEADS)} leads, registrada no ${HISTORICAL_BEST_LAUNCH}.`,
  ];
  const recentDelta = data.summary.current - data.summary.previous1;
  const lastDelta = data.summary.current - data.summary.previous2;

  return (
    <div className={`space-y-6 ${tvMode ? "lg:space-y-5" : "lg:space-y-8"}`}>
      <section className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
        <div className="panel-surface relative overflow-hidden rounded-[32px] p-7 sm:p-8">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
          <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-36 w-36 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="relative space-y-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <Badge tone="primary">Comparativo de captação</Badge>
                <SectionHeading
                  eyebrow="Comparativo entre o lançamento atual e os dois anteriores"
                  title="Leads em tempo real comparando três lançamentos no mesmo ponto da jornada."
                  description="A leitura acompanha apenas o tempo relativo desde o início da captação de cada ciclo, sem depender da data do calendário."
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[320px]">
                <MetricChip
                  label="Atualização"
                  value={lastUpdated ? lastUpdated.toLocaleTimeString("pt-BR") : "--:--:--"}
                />
                <MetricChip
                  label="Status"
                  value={isRefreshing ? "Sincronizando dados..." : `${sourceLabel} a cada 60s`}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="panel-muted rounded-[24px] p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Atual</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {formatWholeNumber(data.summary.current)}
                </p>
                <p className="mt-2 text-sm text-cyan-200">
                  {formatCompactNumber(data.summary.current)} leads acumulados
                </p>
              </div>
              <div className="panel-muted rounded-[24px] p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Recente</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {formatWholeNumber(data.summary.previous1)}
                </p>
                <p className="mt-2 text-sm text-emerald-200">Lançamento de fevereiro</p>
              </div>
              <div className="panel-muted rounded-[24px] p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Último</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {formatWholeNumber(data.summary.previous2)}
                </p>
                <p className="mt-2 text-sm text-[#d7bf72]">Lançamento de novembro</p>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-surface rounded-[32px] p-7 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Momento atual
              </p>
              <h3 className="mt-3 text-3xl font-semibold text-white">Performance relativa</h3>
            </div>
            <Badge tone={sourceTone}>{sourceLabel}</Badge>
          </div>

          <div className="mt-8 space-y-4">
            {insights.slice(0, tvMode ? 3 : 3).map((insight) => (
              <div
                key={insight}
                className="panel-muted rounded-[22px] px-5 py-4 text-sm leading-6 text-slate-200"
              >
                {insight}
              </div>
            ))}
          </div>

          {error && data.meta?.source === "mock" ? (
            <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {!error && fallbackReason && data.meta?.source === "mock" ? (
            <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              A API ao vivo falhou e a dashboard caiu no mock: {fallbackReason}
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total atual"
          value={formatWholeNumber(data.summary.current)}
          accent="from-cyan-400/30 via-cyan-400/12 to-transparent"
          meta={<Badge tone="primary">Atual</Badge>}
          footer="Total acumulado no ponto relativo atual da captação."
        />
        <StatCard
          label={
            <>
              <span className="xl:hidden min-[1700px]:inline">Vs. recente</span>
              <span className="hidden xl:inline min-[1700px]:hidden">Vs. Recen.</span>
            </>
          }
          value={formatPercent(data.summary.growth_vs_previous1)}
          accent="from-emerald-400/30 via-emerald-400/12 to-transparent"
          meta={<Badge tone="success">Recente</Badge>}
          footer={getDeltaFooter(recentDelta, "recente")}
        />
        <StatCard
          label="Vs. último"
          value={formatPercent(data.summary.growth_vs_previous2)}
          accent="from-yellow-400/30 via-yellow-400/12 to-transparent"
          meta={<Badge tone="warning">Último</Badge>}
          footer={getDeltaFooter(lastDelta, "último")}
        />
        <StatCard
          label={
            <>
              <span className="xl:hidden min-[1700px]:inline">Captação histórica</span>
              <span className="hidden xl:inline min-[1700px]:hidden">Cap. Histór.</span>
            </>
          }
          value={formatWholeNumber(HISTORICAL_BEST_LEADS)}
          accent="from-fuchsia-400/30 via-fuchsia-400/12 to-transparent"
          meta={
            <div className="mr-2">
              <Badge tone="primary" className="px-2 tracking-[0.14em]">
                História
              </Badge>
            </div>
          }
          footer="Maior captação até hoje, registrada no L2602."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <article className="panel-surface rounded-[32px] p-6 sm:p-7">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">
                Curva acumulada
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                Evolução sincronizada por tempo relativo
              </h3>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-300">
              A linha principal acompanha o lançamento atual, enquanto os benchmarks seguem exatamente o mesmo tempo desde o início de cada captação.
            </p>
          </div>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Filtro
            </span>
            <div className="relative min-w-[190px]">
              <select
                value={selectedCurveDay === "all" ? "all" : String(selectedCurveDay)}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSelectedCurveDay(nextValue === "all" ? "all" : Number(nextValue));
                }}
                className="h-11 w-full appearance-none rounded-full border border-white/10 bg-white/[0.04] px-4 pr-11 text-sm font-medium text-slate-100 outline-none transition hover:bg-white/[0.06] focus:border-cyan-300/30 focus:bg-white/[0.07]"
              >
                <option value="all">Visão geral</option>
                {curveFilterDays.map((day) => (
                  <option key={day} value={day}>
                    Dia {day}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                <svg
                  width="12"
                  height="8"
                  viewBox="0 0 12 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 1.25L6 6.25L11 1.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
          <AccumulatedLineChart
            data={data.series}
            summary={data.summary}
            currentElapsedHours={currentElapsedHours}
            selectedDay={selectedCurveDay}
            heightClassName={tvMode ? "h-[420px]" : "h-[380px]"}
          />
        </article>

        <article className="grid gap-6">
          <div className="panel-surface rounded-[32px] p-6 sm:p-7">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">
                Ritmo diário
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                Captação por dia relativo
              </h3>
            </div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Filtro
              </span>
              <div className="relative min-w-[190px]">
                <select
                  value={selectedDailyDay === "all" ? "all" : String(selectedDailyDay)}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSelectedDailyDay(nextValue === "all" ? "all" : Number(nextValue));
                  }}
                  className="h-11 w-full appearance-none rounded-full border border-white/10 bg-white/[0.04] px-4 pr-11 text-sm font-medium text-slate-100 outline-none transition hover:bg-white/[0.06] focus:border-cyan-300/30 focus:bg-white/[0.07]"
                >
                  <option value="all">Últimos 3 dias</option>
                  {dailyFilterDays.map((day) => (
                    <option key={day} value={day}>
                      Dia {day}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                  <svg
                    width="12"
                    height="8"
                    viewBox="0 0 12 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1.25L6 6.25L11 1.25"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <DailyBarChart
              data={data.daily}
              selectedDay={selectedDailyDay}
              heightClassName="h-[300px]"
            />
          </div>
          {!tvMode ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="panel-surface rounded-[32px] p-6">
                <ComparisonGauge
                  title="Atual vs. recente"
                  value={data.summary.growth_vs_previous1}
                  color="#39d98a"
                />
              </div>
              <div className="panel-surface rounded-[32px] p-6">
                <ComparisonGauge
                  title="Atual vs. último"
                  value={data.summary.growth_vs_previous2}
                  color="#f8b84e"
                />
              </div>
            </div>
          ) : null}
        </article>
      </section>

      {tvMode ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="panel-surface rounded-[32px] p-6">
            <ComparisonGauge
              title="Atual vs. recente"
              value={data.summary.growth_vs_previous1}
              color="#39d98a"
              heightClassName="h-[280px]"
            />
          </div>
          <div className="panel-surface rounded-[32px] p-6">
            <ComparisonGauge
              title="Atual vs. último"
              value={data.summary.growth_vs_previous2}
              color="#f8b84e"
              heightClassName="h-[280px]"
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
