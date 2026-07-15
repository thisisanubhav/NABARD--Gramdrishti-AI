import { useTranslation } from "react-i18next";
import { RISK_BG, RISK_COLOR } from "../theme";
import type { RiskLevel } from "../api/types";

export function RiskBadge({ level, className = "" }: { level: RiskLevel; className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
      style={{ backgroundColor: RISK_BG[level], color: RISK_COLOR[level] }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RISK_COLOR[level] }} />
      {t(`risk.${level}`)}
    </span>
  );
}
