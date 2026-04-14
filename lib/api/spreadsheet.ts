import fs from "node:fs";

import * as XLSX from "xlsx";

import { DashboardDailyPoint, DashboardPayload, DashboardSeriesPoint } from "@/lib/api/types";
import { formatPercent } from "@/lib/utils/format";

type LaunchRow = {
  email: string;
  occurredAt: Date;
};

type LaunchSheet = {
  name: string;
  startAt: Date;
  rows: LaunchRow[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function parseCellDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) {
      return null;
    }

    return new Date(
      parsed.y,
      parsed.m - 1,
      parsed.d,
      parsed.H,
      parsed.M,
      Math.floor(parsed.S),
    );
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    const parsedDate = new Date(normalized);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  return null;
}

function parseStartDateFromFormula(formula: string | undefined): Date | null {
  if (!formula) {
    return null;
  }

  const match = formula.match(/DATE\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})\)/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
}

function getSheetCellFormula(sheet: XLSX.WorkSheet, address: string): string | undefined {
  const cell = sheet[address];
  return typeof cell?.f === "string" ? cell.f : undefined;
}

function getSheetRows(sheet: XLSX.WorkSheet): Array<Record<string, unknown>> {
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: true,
  });
}

function loadLaunchSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
  startFormulaCell: string,
): LaunchSheet {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`A aba "${sheetName}" não foi encontrada na planilha.`);
  }

  const startAt = parseStartDateFromFormula(getSheetCellFormula(sheet, startFormulaCell));
  if (!startAt) {
    throw new Error(`Não foi possível identificar a data inicial da aba "${sheetName}".`);
  }

  const rows = getSheetRows(sheet)
    .map((row) => ({
      email: String(row.Email ?? "").trim(),
      occurredAt: parseCellDate(row.Data),
    }))
    .filter((row): row is LaunchRow => Boolean(row.email && row.occurredAt))
    .sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime());

  return {
    name: sheetName,
    startAt,
    rows,
  };
}

function countRowsUntil(launch: LaunchSheet, elapsedMs: number) {
  const limit = launch.startAt.getTime() + elapsedMs;
  return launch.rows.filter((row) => {
    const time = row.occurredAt.getTime();
    return time >= launch.startAt.getTime() && time <= limit;
  }).length;
}

function buildSeries(
  current: LaunchSheet,
  previous1: LaunchSheet,
  previous2: LaunchSheet,
  elapsedMs: number,
): DashboardSeriesPoint[] {
  const elapsedHours = Math.max(0, elapsedMs / HOUR_MS);
  const preciseElapsedHours = Number(elapsedHours.toFixed(2));
  const stepHours =
    elapsedHours <= 48 ? 1 : elapsedHours <= 120 ? 6 : elapsedHours <= 240 ? 12 : 24;

  const timePoints = new Set<number>([0]);
  for (let hour = stepHours; hour < preciseElapsedHours; hour += stepHours) {
    timePoints.add(hour);
  }
  timePoints.add(preciseElapsedHours);

  return Array.from(timePoints)
    .sort((a, b) => a - b)
    .map((time) => {
      const pointElapsedMs = Math.min(time * HOUR_MS, elapsedMs);
      return {
        time,
        current: countRowsUntil(current, pointElapsedMs),
        previous1: countRowsUntil(previous1, pointElapsedMs),
        previous2: countRowsUntil(previous2, pointElapsedMs),
      };
    });
}

function buildDaily(
  current: LaunchSheet,
  previous1: LaunchSheet,
  previous2: LaunchSheet,
  elapsedMs: number,
): DashboardDailyPoint[] {
  const totalDays = Math.max(1, Math.ceil(elapsedMs / DAY_MS));
  const days = Array.from({ length: totalDays }, (_, index) => index + 1);

  const countDay = (launch: LaunchSheet, day: number) => {
    const dayStart = launch.startAt.getTime() + (day - 1) * DAY_MS;
    const dayEnd = Math.min(launch.startAt.getTime() + day * DAY_MS, launch.startAt.getTime() + elapsedMs);

    return launch.rows.filter((row) => {
      const time = row.occurredAt.getTime();
      return time >= dayStart && time <= dayEnd;
    }).length;
  };

  return days.map((day) => ({
    day,
    current: countDay(current, day),
    previous1: countDay(previous1, day),
    previous2: countDay(previous2, day),
  }));
}

function safeGrowth(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? 1 : 0;
  }

  return (current - previous) / previous;
}

function buildInsights(
  currentTotal: number,
  previous1Total: number,
  previous2Total: number,
  averageTotal: number,
) {
  const growth1 = safeGrowth(currentTotal, previous1Total);
  const growth2 = safeGrowth(currentTotal, previous2Total);
  const growthAverage = safeGrowth(currentTotal, averageTotal);

  if (currentTotal === 0) {
    return [
      "A captação atual ainda não registrou leads válidos dentro da janela comparativa.",
      "Assim que os novos leads entrarem na Página1, a comparação começará a refletir o mesmo tempo relativo dos lançamentos anteriores.",
    ];
  }

  return [
    `O lançamento atual está ${formatPercent(Math.abs(growth1))} ${growth1 >= 0 ? "acima" : "abaixo"} do último no mesmo ponto relativo da captação.`,
    `A comparação contra o penúltimo mostra ${formatPercent(Math.abs(growth2))} ${growth2 >= 0 ? "de vantagem" : "de desvantagem"} no mesmo recorte temporal.`,
    `A média histórica dos dois ciclos anteriores está ${formatPercent(Math.abs(growthAverage))} ${growthAverage >= 0 ? "abaixo" : "acima"} do lançamento atual.`,
    `A leitura considera apenas os leads já liberados pelo mesmo tempo decorrido desde o início de cada captação.`,
  ];
}

function buildDashboardPayload(workbook: XLSX.WorkBook): DashboardPayload {
  const current = loadLaunchSheet(workbook, "Página1", "C2");
  const previous1 = loadLaunchSheet(workbook, "Página2", "C2");
  const previous2 = loadLaunchSheet(workbook, "Página3", "C2");

  const currentValidRows = current.rows.filter(
    (row) => row.occurredAt.getTime() >= current.startAt.getTime(),
  );
  const lastCurrentEvent = currentValidRows.at(-1)?.occurredAt ?? null;
  const elapsedMs = lastCurrentEvent
    ? Math.max(0, lastCurrentEvent.getTime() - current.startAt.getTime())
    : 0;

  const currentTotal = currentValidRows.filter(
    (row) => row.occurredAt.getTime() <= (lastCurrentEvent?.getTime() ?? current.startAt.getTime()),
  ).length;
  const previous1Total = countRowsUntil(previous1, elapsedMs);
  const previous2Total = countRowsUntil(previous2, elapsedMs);
  const averageTotal = (previous1Total + previous2Total) / 2;

  return {
    summary: {
      current: currentTotal,
      previous1: previous1Total,
      previous2: previous2Total,
      growth_vs_previous1: safeGrowth(currentTotal, previous1Total),
      growth_vs_previous2: safeGrowth(currentTotal, previous2Total),
      growth_vs_average: safeGrowth(currentTotal, averageTotal),
    },
    series: buildSeries(current, previous1, previous2, elapsedMs),
    daily: buildDaily(current, previous1, previous2, elapsedMs),
    insights: buildInsights(currentTotal, previous1Total, previous2Total, averageTotal),
    meta: {
      source: "spreadsheet",
      current_elapsed_hours: Number((elapsedMs / HOUR_MS).toFixed(2)),
      current_elapsed_days: Number((elapsedMs / DAY_MS).toFixed(2)),
      last_event_at: lastCurrentEvent ? lastCurrentEvent.toISOString() : null,
    },
  };
}

export function parseDashboardSpreadsheet(filePath: string): DashboardPayload {
  if (!fs.existsSync(filePath)) {
    throw new Error("O arquivo da planilha configurado não foi encontrado.");
  }

  const workbook = XLSX.readFile(filePath, {
    cellDates: true,
    cellFormula: true,
  });

  return buildDashboardPayload(workbook);
}

export function parseDashboardSpreadsheetBuffer(buffer: Buffer): DashboardPayload {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    cellFormula: true,
  });

  return buildDashboardPayload(workbook);
}
