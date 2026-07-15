import { useTranslation } from "react-i18next";
import { RISK_BG, RISK_COLOR } from "../theme";
import type { RiskDriver, RiskLevel } from "../api/types";

const ICON: Record<RiskLevel, string> = { low: "✓", medium: "!", high: "!" };

export function AlertBanner({
  level,
  message,
  horizonMonths,
  drivers,
}: {
  level: RiskLevel;
  message: string;
  horizonMonths: number;
  drivers: RiskDriver[];
}) {
  const { t } = useTranslation();
  const topDrivers = drivers.filter((d) => d.direction === "increases_risk").slice(0, 3);

  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: RISK_BG[level], borderColor: RISK_COLOR[level] + "40" }}>
      <div className="flex items-start gap-3">
        <span
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: RISK_COLOR[level] }}
        >
          {ICON[level]}
        </span>
        <div>
          <p className="text-sm font-medium" style={{ color: RISK_COLOR[level] }}>
            {message}
          </p>
          {level !== "low" && (
            <p className="text-xs text-slate-500 mt-0.5">
              {t("risk.estimatedHorizon", { count: horizonMonths })}
            </p>
          )}
          {topDrivers.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {topDrivers.map((d) => (
                <li key={d.feature} className="text-xs text-slate-600 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
                  {d.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
