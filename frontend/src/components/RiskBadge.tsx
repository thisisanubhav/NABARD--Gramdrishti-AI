import { useTranslation } from "react-i18next";
import { RISK_BG, RISK_COLOR } from "../theme";
import type { RiskLevel } from "../api/types";
import { Icon } from "./Icon";

const LEVEL_ICON: Record<RiskLevel, string> = {
  low: "shield",
  medium: "error",
  high: "warning",
};

export function RiskBadge({ level, className = "" }: { level: RiskLevel; className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-label-sm text-label-sm font-bold ${className}`}
      style={{ backgroundColor: RISK_BG[level], color: RISK_COLOR[level] }}
    >
      <Icon name={LEVEL_ICON[level]} filled size={14} />
      {t(`risk.${level}`)}
    </span>
  );
}
