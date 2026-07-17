import { useTranslation } from "react-i18next";
import { RISK_COLOR } from "../theme";
import type { RiskLevel } from "../api/types";
import { RiskBadge } from "./RiskBadge";

export function RiskGauge({ level, score }: { level: RiskLevel; score: number }) {
  const { t } = useTranslation();
  const pct = Math.round(score * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <RiskBadge level={level} />
        <span className="font-kpi-number text-lg font-bold tabular-nums" style={{ color: RISK_COLOR[level] }}>
          {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-variant overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: RISK_COLOR[level] }}
        />
      </div>
      <div className="flex justify-between mt-1 font-label-caps text-[10px] text-slate-muted">
        <span>{t("risk.levelLow")}</span>
        <span>{t("risk.levelMedium")}</span>
        <span>{t("risk.levelHigh")}</span>
      </div>
    </div>
  );
}
