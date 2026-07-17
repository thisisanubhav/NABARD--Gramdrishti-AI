import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  sublabel,
  accent,
  delta,
  icon,
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: string;
  /** Real, computed DeltaBadge element — never pass fabricated text here. */
  delta?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-[0_2px_12px_-4px_rgba(0,80,58,0.08)]">
      {(icon || delta) && (
        <div className="flex items-center justify-between mb-2">
          {icon}
          {delta}
        </div>
      )}
      <p className="font-label-caps text-label-caps text-slate-muted uppercase">{label}</p>
      <p className="mt-2 font-kpi-number text-kpi-number text-text-charcoal" style={{ color: accent }}>
        {value}
      </p>
      {sublabel && <p className="mt-1 font-label-sm text-label-sm text-slate-muted">{sublabel}</p>}
    </div>
  );
}
