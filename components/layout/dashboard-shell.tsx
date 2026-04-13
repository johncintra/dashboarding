import { ReactNode } from "react";

type DashboardShellProps = {
  children: ReactNode;
  tvMode?: boolean;
};

export function DashboardShell({
  children,
  tvMode = false,
}: DashboardShellProps) {
  return (
    <main className={tvMode ? "min-h-screen px-6 py-6 sm:px-8" : "min-h-screen px-6 py-8 sm:px-8 lg:px-12"}>
      <div className="mx-auto max-w-[1600px]">{children}</div>
    </main>
  );
}
