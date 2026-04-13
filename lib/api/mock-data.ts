import { DashboardPayload } from "@/lib/api/types";

export const mockDashboardData: DashboardPayload = {
  summary: {
    current: 121600,
    previous1: 81100,
    previous2: 75200,
    growth_vs_previous1: 0.5,
    growth_vs_previous2: 0.62,
    growth_vs_average: 0.56,
  },
  series: [
    { time: 0, current: 0, previous1: 0, previous2: 0 },
    { time: 6, current: 1350, previous1: 1010, previous2: 900 },
    { time: 12, current: 5200, previous1: 3890, previous2: 3510 },
    { time: 18, current: 9400, previous1: 7200, previous2: 6640 },
    { time: 24, current: 15000, previous1: 12000, previous2: 11000 },
    { time: 36, current: 28750, previous1: 21400, previous2: 19850 },
    { time: 48, current: 41400, previous1: 30200, previous2: 27900 },
    { time: 60, current: 59800, previous1: 41950, previous2: 39200 },
    { time: 72, current: 78400, previous1: 54500, previous2: 50350 },
    { time: 84, current: 96800, previous1: 66100, previous2: 62000 },
    { time: 96, current: 121600, previous1: 81100, previous2: 75200 },
  ],
  daily: [
    { day: 1, current: 15000, previous1: 12000, previous2: 11000 },
    { day: 2, current: 26400, previous1: 18200, previous2: 16900 },
    { day: 3, current: 37000, previous1: 25500, previous2: 22400 },
    { day: 4, current: 43200, previous1: 25400, previous2: 24900 },
  ],
  insights: [
    "O lançamento atual está 50% acima do último no mesmo ponto relativo da captação.",
    "A curva atual sustenta 62% de vantagem sobre o penúltimo lançamento.",
    "A média histórica dos dois últimos ciclos está 56% abaixo do lançamento atual.",
    "O ritmo do Dia 4 indica aceleração acima da tendência consolidada dos ciclos anteriores.",
  ],
};
