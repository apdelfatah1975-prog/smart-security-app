import type { ReactNode } from "react";

type SummaryItem = {
  label: string;
  value: ReactNode;
  tone?: "teal" | "amber" | "violet" | "slate";
};

type InternalPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  summaries?: SummaryItem[];
};

const toneClasses: Record<NonNullable<SummaryItem["tone"]>, string> = {
  teal: "bg-teal-50 text-teal-900 ring-teal-900/5",
  amber: "bg-amber-50 text-amber-950 ring-amber-900/5",
  violet: "bg-violet-50 text-violet-950 ring-violet-900/5",
  slate: "bg-slate-950 text-white ring-slate-950/10",
};

export default function InternalPageHeader({ eyebrow, title, description, actions, summaries = [] }: InternalPageHeaderProps) {
  return (
    <header className="space-y-4">
      <div className="soft-card overflow-hidden bg-gradient-to-l from-teal-950 via-teal-900 to-slate-900 p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black tracking-wide text-teal-200">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-teal-50/85 sm:text-base">{description}</p>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
      {summaries.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaries.map((item) => (
            <div key={item.label} className={`rounded-2xl p-4 ring-1 ${toneClasses[item.tone ?? "teal"]}`}>
              <p className="text-xs font-black opacity-70">{item.label}</p>
              <p className="mt-1 truncate text-xl font-black">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </header>
  );
}
