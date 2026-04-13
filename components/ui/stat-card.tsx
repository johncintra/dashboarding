import { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  accent?: string;
  accentClassName?: string;
  meta?: ReactNode;
  footer?: ReactNode;
};

export function StatCard({
  label,
  value,
  accent = "from-cyan-400/20 via-cyan-400/10 to-transparent",
  accentClassName = "",
  meta,
  footer,
}: StatCardProps) {
  return (
    <article className="panel-surface relative overflow-hidden rounded-[28px] p-6">
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${accent} ${accentClassName}`} />
      <div className="relative flex h-full flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
              {label}
            </p>
            <h3 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              {value}
            </h3>
          </div>
          {meta}
        </div>
        {footer ? <div className="text-sm text-slate-300">{footer}</div> : null}
      </div>
    </article>
  );
}
