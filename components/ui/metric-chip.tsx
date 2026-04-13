type MetricChipProps = {
  label: string;
  value: string;
};

export function MetricChip({ label, value }: MetricChipProps) {
  return (
    <div className="panel-muted min-h-[132px] rounded-2xl px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold leading-6 text-white sm:text-base">
        {value}
      </p>
    </div>
  );
}
