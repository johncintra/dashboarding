type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-white/[0.06] shadow-soft ${className}`}
    />
  );
}
