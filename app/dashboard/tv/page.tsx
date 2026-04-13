import { DashboardView } from "@/components/dashboard-view";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardTvPage() {
  return (
    <DashboardShell tvMode>
      <DashboardView tvMode />
    </DashboardShell>
  );
}
