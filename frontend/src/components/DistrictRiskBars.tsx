import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";

export interface DistrictRisk {
  district: string;
  state: string;
  count: number;
  avgRiskScore: number;
}

/** Ranked "which district to prioritize visiting" view, computed client-side
 * from the officer's already-fetched enterprise list (real district/state/
 * risk_score per enterprise — no map/geocoding data exists, so this is a
 * ranked list rather than a literal map). */
export function DistrictRiskBars({ data }: { data: DistrictRisk[] }) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return <p className="font-body-md text-body-md text-slate-muted">{t("officer.noDistrictData")}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {data.map((d) => {
        const pct = Math.round(d.avgRiskScore * 100);
        return (
          <div key={`${d.district}-${d.state}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon name="location_on" size={16} className="text-slate-muted flex-shrink-0" />
              <span className="font-body-md text-body-md text-on-surface flex-1">
                {d.district}
                <span className="text-slate-muted"> · {d.state}</span>
              </span>
              <span className="font-label-sm text-label-sm text-slate-muted">
                {t("officer.enterpriseCount", { count: d.count })}
              </span>
              <span className="font-label-sm text-label-sm font-bold text-error w-10 text-right">{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-error" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
