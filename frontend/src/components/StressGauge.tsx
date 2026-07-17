import { useTranslation } from "react-i18next";
import { RISK_COLOR } from "../theme";
import type { RiskLevel } from "../api/types";
import { RiskBadge } from "./RiskBadge";

/** The diamond "AI Risk Health" visual — a rotated square border colored by
 * risk level, with a counter-rotated inner block so the number stays upright.
 * Score/level are the same real risk.score / risk.level used everywhere else. */
export function StressGauge({ level, score }: { level: RiskLevel; score: number }) {
  const { t } = useTranslation();
  const index = Math.round(score * 100);

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-end w-full mb-3">
        <RiskBadge level={level} />
      </div>
      <div className="relative w-40 h-40 flex items-center justify-center">
        <div
          className="absolute inset-3 rotate-45 rounded-2xl border-[6px] bg-surface-container-lowest"
          style={{ borderColor: RISK_COLOR[level] }}
        />
        <div className="relative z-10 flex flex-col items-center">
          <span className="font-kpi-number text-kpi-number text-text-charcoal">{index}</span>
          <span className="font-label-caps text-label-caps text-slate-muted mt-1 text-center">
            {t("detail.stressIndex")}
          </span>
        </div>
      </div>
    </div>
  );
}
