import { NextResponse } from "next/server";

import { mockDashboardData } from "@/lib/api/mock-data";

export async function GET() {
  return NextResponse.json(mockDashboardData);
}
