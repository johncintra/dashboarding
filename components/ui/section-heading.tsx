import { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.38em] text-cyan-200/72">
        {eyebrow}
      </p>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
