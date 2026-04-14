"use client";

import { EChartsOption } from "echarts";

import { EChart } from "@/components/charts/echart";
import { DashboardSeriesPoint, DashboardSummary } from "@/lib/api/types";
import { formatWholeNumber } from "@/lib/utils/format";

type AccumulatedLineChartProps = {
  data: DashboardSeriesPoint[];
  summary: DashboardSummary;
  currentElapsedHours: number;
  selectedDay?: number | "all";
  heightClassName?: string;
};

const CAPTURE_DAYS = 21;
const HOURLY_SAMPLE_STEP = 0.25;

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

function interpolateValue(
  hour: number,
  left: DashboardSeriesPoint,
  right: DashboardSeriesPoint,
  key: "current" | "previous1" | "previous2",
) {
  if (right.time === left.time) {
    return right[key];
  }

  const ratio = (hour - left.time) / (right.time - left.time);
  const easedRatio = 0.5 - Math.cos(Math.PI * ratio) / 2;
  return left[key] + (right[key] - left[key]) * easedRatio;
}

function buildHourlySeries(
  points: DashboardSeriesPoint[],
  safeElapsedHours: number,
  summary: DashboardSummary,
) {
  const hasDetailedSeries = points.some((point) => point.time > 0);
  const baseSeries = hasDetailedSeries
    ? points
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

  if (baseSeries.length <= 1) {
    return baseSeries;
  }

  const maxHour = Math.max(1, Math.ceil(Math.max(safeElapsedHours, baseSeries.at(-1)?.time ?? 0)));
  const hourlySeries: DashboardSeriesPoint[] = [];

  for (let hour = 0; hour <= maxHour; hour += HOURLY_SAMPLE_STEP) {
    const roundedHour = Number(hour.toFixed(2));
    const exactPoint = baseSeries.find((point) => point.time === roundedHour);

    if (exactPoint) {
      hourlySeries.push(exactPoint);
      continue;
    }

    const rightIndex = baseSeries.findIndex((point) => point.time > roundedHour);

    if (rightIndex === -1) {
      const lastPoint = baseSeries.at(-1)!;
      hourlySeries.push({
        time: roundedHour,
        current: lastPoint.current,
        previous1: lastPoint.previous1,
        previous2: lastPoint.previous2,
      });
      continue;
    }

    const rightPoint = baseSeries[rightIndex];
    const leftPoint = baseSeries[Math.max(0, rightIndex - 1)];

    hourlySeries.push({
      time: roundedHour,
      current: interpolateValue(roundedHour, leftPoint, rightPoint, "current"),
      previous1: interpolateValue(roundedHour, leftPoint, rightPoint, "previous1"),
      previous2: interpolateValue(roundedHour, leftPoint, rightPoint, "previous2"),
    });
  }

  const hasExactCurrentPoint = hourlySeries.some((point) => point.time === safeElapsedHours);

  if (!hasExactCurrentPoint && safeElapsedHours > 0) {
    const lastPoint = baseSeries.at(-1)!;
    hourlySeries.push({
      time: safeElapsedHours,
      current: lastPoint.current,
      previous1: lastPoint.previous1,
      previous2: lastPoint.previous2,
    });
  }

  return hourlySeries.sort((left, right) => left.time - right.time);
}

function buildAxisLabel(value: number, selectedDay: number | "all", dayStartHour: number) {
  if (selectedDay === "all") {
    return `Dia ${Math.floor(value / 24) + 1}`;
  }

  return `${Math.round(value - dayStartHour)}h`;
}

function getDisplayDayRange(day: number) {
  const start = (day - 1) * 24;
  return {
    start,
    end: start + 24,
  };
}

function buildTooltipTitle(axisValue: number) {
  const day = Math.floor(axisValue / 24) + 1;
  const hour = Math.floor(axisValue % 24);
  return `Dia ${day} · ${hour}h`;
}

export function AccumulatedLineChart({
  data,
  summary,
  currentElapsedHours,
  selectedDay = "all",
  heightClassName = "h-[360px]",
}: AccumulatedLineChartProps) {
  const safeElapsedHours = Math.max(0, Math.min(CAPTURE_DAYS * 24, currentElapsedHours));
  const currentDay = Math.max(1, Math.ceil(safeElapsedHours / 24) || 1);
  const visibleDayLabels = Math.min(CAPTURE_DAYS, Math.max(3, currentDay + 1));
  const axisMaxHours = Math.max(48, (visibleDayLabels - 1) * 24);
  const hourlySeries = buildHourlySeries(data, safeElapsedHours, summary);

  const selectedDayRange = selectedDay === "all" ? null : getDisplayDayRange(selectedDay);
  const dayStartHour = selectedDayRange?.start ?? 0;
  const dayEndHour = selectedDayRange?.end ?? axisMaxHours;

  const dayStartPoint = hourlySeries
    .filter((point) => point.time <= dayStartHour)
    .at(-1) ?? { time: dayStartHour, current: 0, previous1: 0, previous2: 0 };

  const normalizedSeries =
    selectedDay === "all"
      ? hourlySeries.filter((point) => point.time <= axisMaxHours)
      : [
          {
            time: dayStartHour,
            current: dayStartPoint.current,
            previous1: dayStartPoint.previous1,
            previous2: dayStartPoint.previous2,
          },
          ...hourlySeries.filter((point) => point.time > dayStartHour && point.time <= dayEndHour),
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
        const header = `<div style="margin-bottom:10px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#8fa6c7">${buildTooltipTitle(axisValue)}</div>`;
        const rows = points
          .filter((point) => point.value?.[1] !== null)
          .map(
            (point) =>
              `<div style="display:flex;justify-content:space-between;gap:20px;margin:6px 0;"><span style="color:${point.color}">${point.seriesName}</span><strong>${formatWholeNumber(Math.round(point.value[1]))}</strong></div>`,
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
      min: selectedDay === "all" ? 0 : dayStartHour,
      max: dayEndHour,
      interval: selectedDay === "all" ? 24 : 4,
      axisLabel: {
        color: "#8fa6c7",
        showMinLabel: true,
        showMaxLabel: true,
        hideOverlap: false,
        formatter: (value: number) => buildAxisLabel(Number(value), selectedDay, dayStartHour),
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
        smoothMonotone: "x",
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
        smoothMonotone: "x",
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
        smoothMonotone: "x",
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
