import { useTranslation } from "react-i18next";
import { RISK_BG, RISK_COLOR, RISK_LEVEL_KEY } from "../theme";
import type { RiskDriver, RiskLevel } from "../api/types";
import { Icon } from "./Icon";

const LEVEL_ICON: Record<RiskLevel, string> = {
  low: "shield",
  medium: "error",
  high: "warning",
};

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
    <section
      className="rounded-lg p-stack-md flex gap-stack-md items-start border border-l-4"
      style={{ backgroundColor: RISK_BG[level], borderColor: RISK_COLOR[level] }}
    >
      <Icon name={LEVEL_ICON[level]} filled className="mt-1 flex-shrink-0" color={RISK_COLOR[level]} />
      <div>
        <h3 className="font-headline-md text-headline-md mb-1" style={{ color: RISK_COLOR[level] }}>
          {t(RISK_LEVEL_KEY[level])} {t("risk.alertSuffix")}
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
        {level !== "low" && (
          <p className="font-label-sm text-label-sm text-slate-muted mt-1">
            {t("risk.estimatedHorizon", { count: horizonMonths })}
          </p>
        )}
        {topDrivers.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {topDrivers.map((d) => (
              <li key={d.feature} className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-slate-muted flex-shrink-0" />
                {d.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
