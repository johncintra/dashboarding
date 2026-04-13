"use client";

import { EChartsOption } from "echarts";

import { EChart } from "@/components/charts/echart";
import { formatPercent } from "@/lib/utils/format";

type ComparisonGaugeProps = {
  title: string;
  value: number;
  color: string;
  heightClassName?: string;
};

export function ComparisonGauge({
  title,
  value,
  color,
  heightClassName = "h-[250px]",
}: ComparisonGaugeProps) {
  const signedValue = Number.isFinite(value) ? value : 0;
  const normalized = Math.abs(signedValue);
  const max = Math.max(1, Math.ceil(normalized * 4) / 4);

  const option: EChartsOption = {
    backgroundColor: "transparent",
    series: [
      {
        type: "gauge",
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max,
        radius: "92%",
        progress: {
          show: true,
          width: 18,
          itemStyle: {
            color,
            shadowColor: color,
            shadowBlur: 18,
          },
        },
        pointer: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            width: 18,
            color: [[1, "rgba(143,166,199,0.14)"]],
          },
        },
        splitLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        title: {
          offsetCenter: [0, "55%"],
          color: "#8fa6c7",
          fontSize: 13,
        },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, "2%"],
          formatter: () =>
            `${signedValue < 0 ? "-" : ""}${formatPercent(normalized)}`,
          color: "#ffffff",
          fontSize: 32,
          fontWeight: 700,
        },
        data: [
          {
            value: normalized,
            name: title,
          },
        ],
      },
    ],
  };

  return <EChart option={option} className={heightClassName} />;
}
