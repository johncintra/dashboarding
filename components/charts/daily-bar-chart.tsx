"use client";

import { EChartsOption } from "echarts";

import { EChart } from "@/components/charts/echart";
import { DashboardDailyPoint } from "@/lib/api/types";
import { formatWholeNumber } from "@/lib/utils/format";

type DailyBarChartProps = {
  data: DashboardDailyPoint[];
  selectedDay?: number | "all";
  heightClassName?: string;
};

const CAPTURE_DAYS = 21;

function formatBarLabel(value: unknown) {
  if (typeof value !== "number" || value <= 0) {
    return "";
  }

  return formatWholeNumber(value);
}

function getNiceAxisMax(value: number) {
  if (value <= 15000) {
    return 15000;
  }

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

export function DailyBarChart({
  data,
  selectedDay = "all",
  heightClassName = "h-[320px]",
}: DailyBarChartProps) {
  const dailyMap = new Map(data.map((item) => [item.day, item]));
  const highestDay = data.length > 0 ? Math.max(...data.map((item) => item.day)) : 1;
  const days =
    selectedDay === "all"
      ? (() => {
          const endDay = Math.max(3, highestDay);
          const startDay = Math.max(1, endDay - 2);
          return Array.from({ length: endDay - startDay + 1 }, (_, index) => startDay + index);
        })()
      : [selectedDay];
  const showBarLabels = true;
  const maxValue = Math.max(
    10,
    ...data.flatMap((item) => [item.current, item.previous1, item.previous2]),
  );

  const option: EChartsOption = {
    backgroundColor: "transparent",
    animationDuration: 800,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(7, 14, 26, 0.96)",
      borderColor: "rgba(143, 166, 199, 0.18)",
      textStyle: { color: "#f8fbff" },
    },
    legend: {
      top: 0,
      textStyle: { color: "#c9d7eb" },
    },
    grid: {
      top: 60,
      left: 10,
      right: 12,
      bottom: 10,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: days.map((day) => `Dia ${day}`),
      axisLabel: { color: "#8fa6c7" },
      axisLine: {
        lineStyle: { color: "rgba(143,166,199,0.18)" },
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 15000,
      interval: 5000,
      axisLabel: {
        color: "#8fa6c7",
        formatter: (value: number) => formatWholeNumber(Number(value)),
      },
      splitLine: {
        lineStyle: { color: "rgba(143,166,199,0.08)" },
      },
    },
    series: [
      {
        name: "Atual",
        type: "bar",
        barGap: 0,
        label: {
          show: showBarLabels,
          position: "top",
          distance: 8,
          color: "#d9f5fb",
          fontSize: 11,
          fontWeight: 600,
          formatter: (params: { value?: unknown }) => formatBarLabel(params.value),
        },
        itemStyle: {
          color: "#6ee7f9",
          borderRadius: [12, 12, 4, 4],
        },
        data: days.map((day) => dailyMap.get(day)?.current ?? null),
      },
      {
        name: "Recente",
        type: "bar",
        label: {
          show: showBarLabels,
          position: "top",
          distance: 8,
          color: "#dcfae9",
          fontSize: 11,
          fontWeight: 600,
          formatter: (params: { value?: unknown }) => formatBarLabel(params.value),
        },
        itemStyle: {
          color: "#39d98a",
          borderRadius: [12, 12, 4, 4],
        },
        data: days.map((day) => dailyMap.get(day)?.previous1 ?? null),
      },
      {
        name: "Último",
        type: "bar",
        label: {
          show: showBarLabels,
          position: "top",
          distance: 8,
          color: "#fee6b6",
          fontSize: 11,
          fontWeight: 600,
          formatter: (params: { value?: unknown }) => formatBarLabel(params.value),
        },
        itemStyle: {
          color: "#f8b84e",
          borderRadius: [12, 12, 4, 4],
        },
        data: days.map((day) => dailyMap.get(day)?.previous2 ?? null),
      },
    ],
  };

  return <EChart option={option} className={heightClassName} />;
}
