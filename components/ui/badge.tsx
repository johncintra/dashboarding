import { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "primary" | "success" | "warning";
};

const toneClasses = {
  primary: "bg-cyan-400/10 text-cyan-200 ring-cyan-300/20",
  success: "bg-emerald-400/10 text-emerald-200 ring-emerald-300/20",
  warning: "bg-amber-400/10 text-amber-200 ring-amber-300/20",
};

export function Badge({ children, tone = "primary" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] ring-1 ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
