"use client";

import { EChartsOption } from "echarts";

import { EChart } from "@/components/charts/echart";
import { DashboardDailyPoint } from "@/lib/api/types";
import { formatWholeNumber } from "@/lib/utils/format";

type DailyBarChartProps = {
  data: DashboardDailyPoint[];
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

export function DailyBarChart({
  data,
  heightClassName = "h-[320px]",
}: DailyBarChartProps) {
  const dailyMap = new Map(data.map((item) => [item.day, item]));
  const highestDay = data.length > 0 ? Math.max(...data.map((item) => item.day)) : 1;
  const visibleDays = Math.min(CAPTURE_DAYS, Math.max(3, highestDay));
  const days = Array.from({ length: visibleDays }, (_, index) => index + 1);
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
      axisLabel: {
        color: "#8fa6c7",
        formatter: (value: number) => formatWholeNumber(Number(value)),
      },
      splitLine: {
        lineStyle: { color: "rgba(143,166,199,0.08)" },
      },
      max: getNiceAxisMax(maxValue),
    },
    series: [
      {
        name: "Atual",
        type: "bar",
        barGap: 0,
        itemStyle: {
          color: "#6ee7f9",
          borderRadius: [12, 12, 4, 4],
        },
        data: days.map((day) => dailyMap.get(day)?.current ?? null),
      },
      {
        name: "Recente",
        type: "bar",
        itemStyle: {
          color: "#39d98a",
          borderRadius: [12, 12, 4, 4],
        },
        data: days.map((day) => dailyMap.get(day)?.previous1 ?? null),
      },
      {
        name: "Último",
        type: "bar",
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
