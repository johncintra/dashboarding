"use client";

import { EChartsOption } from "echarts";

import { EChart } from "@/components/charts/echart";
import { DashboardSeriesPoint, DashboardSummary } from "@/lib/api/types";
import { formatWholeNumber } from "@/lib/utils/format";

type AccumulatedLineChartProps = {
  data: DashboardSeriesPoint[];
  summary: DashboardSummary;
  currentElapsedHours: number;
  heightClassName?: string;
};

const CAPTURE_DAYS = 21;

function getNiceAxisMax(value: number) {
  if (value <= 10) {
    return 10;
  }

  const rough = value * 1.15;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;

  let niceNormalized = 10;
  if (normalized <= 1) niceNormalized = 1;
  else if (normalized <= 2) niceNormalized = 2;
  else if (normalized <= 5) niceNormalized = 5;

  return niceNormalized * magnitude;
}

export function AccumulatedLineChart({
  data,
  summary,
  currentElapsedHours,
  heightClassName = "h-[360px]",
}: AccumulatedLineChartProps) {
  const safeElapsedHours = Math.max(0, Math.min(CAPTURE_DAYS * 24, currentElapsedHours));
  const currentDay = Math.max(1, Math.ceil(safeElapsedHours / 24) || 1);
  const visibleDayLabels = Math.min(CAPTURE_DAYS, Math.max(3, currentDay + 1));
  const axisMaxHours = Math.max(48, (visibleDayLabels - 1) * 24);

  const hasDetailedSeries = data.some((point) => point.time > 0);
  const normalizedSeries = hasDetailedSeries
    ? data
        .map((point) => ({
          time: point.time,
          current: point.current,
          previous1: point.previous1,
          previous2: point.previous2,
        }))
        .sort((left, right) => left.time - right.time)
    : [
        { time: 0, current: 0, previous1: 0, previous2: 0 },
        {
          time: safeElapsedHours,
          current: summary.current,
          previous1: summary.previous1,
          previous2: summary.previous2,
        },
      ];

  const maxValue = Math.max(
    10,
    ...normalizedSeries.flatMap((point) => [point.current, point.previous1, point.previous2]),
  );

  const option: EChartsOption = {
    backgroundColor: "transparent",
    animationDuration: 900,
    animationEasing: "cubicOut",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(7, 14, 26, 0.96)",
      borderColor: "rgba(143, 166, 199, 0.18)",
      textStyle: {
        color: "#f8fbff",
      },
      extraCssText: "border-radius: 18px; box-shadow: 0 16px 48px rgba(1,7,18,0.38);",
      formatter: (params: unknown) => {
        const points = params as Array<{
          axisValue: number;
          seriesName: string;
          value: [number, number];
          color: string;
        }>;
        const axisValue = Number(points[0]?.axisValue ?? 0);
        const day = Math.floor(axisValue / 24) + 1;
        const hours = Math.floor(axisValue % 24);
        const header = `<div style="margin-bottom:10px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#8fa6c7">Dia ${day} · ${hours}h</div>`;
        const rows = points
          .filter((point) => point.value?.[1] !== null)
          .map(
            (point) =>
              `<div style="display:flex;justify-content:space-between;gap:20px;margin:6px 0;"><span style="color:${point.color}">${point.seriesName}</span><strong>${formatWholeNumber(point.value[1])}</strong></div>`,
          )
          .join("");
        return `${header}${rows}`;
      },
    },
    legend: {
      top: 0,
      textStyle: {
        color: "#c9d7eb",
      },
    },
    grid: {
      top: 60,
      left: 10,
      right: 28,
      bottom: 10,
      containLabel: true,
    },
    xAxis: {
      type: "value",
      min: 0,
      max: axisMaxHours,
      interval: 24,
      axisLabel: {
        color: "#8fa6c7",
        showMinLabel: true,
        showMaxLabel: true,
        hideOverlap: false,
        formatter: (value: number) => `Dia ${Math.floor(Number(value) / 24) + 1}`,
      },
      axisLine: {
        lineStyle: { color: "rgba(143,166,199,0.18)" },
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#8fa6c7",
        formatter: (value: number) => formatWholeNumber(Number(value)),
      },
      splitLine: {
        lineStyle: {
          color: "rgba(143,166,199,0.08)",
        },
      },
      max: getNiceAxisMax(maxValue),
    },
    series: [
      {
        name: "Atual",
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: {
          width: 3,
          color: "#6ee7f9",
          cap: "round",
          join: "round",
        },
        itemStyle: { color: "#6ee7f9" },
        connectNulls: true,
        data: normalizedSeries.map((point) => [point.time, point.current]),
      },
      {
        name: "Recente",
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: {
          width: 3,
          color: "#39d98a",
          cap: "round",
          join: "round",
        },
        itemStyle: { color: "#39d98a" },
        connectNulls: true,
        data: normalizedSeries.map((point) => [point.time, point.previous1]),
      },
      {
        name: "Último",
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: {
          width: 3,
          color: "#f8b84e",
          cap: "round",
          join: "round",
        },
        itemStyle: { color: "#f8b84e" },
        connectNulls: true,
        data: normalizedSeries.map((point) => [point.time, point.previous2]),
      },
    ],
  };

  return <EChart option={option} className={heightClassName} />;
}
