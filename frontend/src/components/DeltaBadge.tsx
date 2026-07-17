import { Icon } from "./Icon";

/** "+4.2%" / "-2.1%" pill computed from two real values — never fabricated.
 * Pass `invert` for metrics where a rise is bad (e.g. expenses). */
export function DeltaBadge({
  current,
  previous,
  invert = false,
}: {
  current: number;
  previous: number | undefined;
  invert?: boolean;
}) {
  if (previous === undefined || previous === 0) return null;

  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Math.round(pct * 10) / 10;
  if (rounded === 0) {
    return (
      <span className="flex items-center gap-1 font-label-sm text-label-sm text-slate-muted bg-surface-variant/40 px-2 py-1 rounded-full">
        <Icon name="trending_flat" size={14} />
        0%
      </span>
    );
  }

  const isRise = rounded > 0;
  const isGood = invert ? !isRise : isRise;

  return (
    <span
      className={`flex items-center gap-1 font-label-sm text-label-sm px-2 py-1 rounded-full ${
        isGood ? "text-success-green bg-success-green/10" : "text-error bg-error/10"
      }`}
    >
      <Icon name={isRise ? "trending_up" : "trending_down"} size={14} />
      {isRise ? "+" : ""}
      {rounded}%
    </span>
  );
}
