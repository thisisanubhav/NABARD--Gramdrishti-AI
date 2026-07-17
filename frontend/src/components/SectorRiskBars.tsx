import { useTranslation } from "react-i18next";
import { SECTOR_COLOR } from "../theme";
import type { SectorBreakdown } from "../api/types";

/** Horizontal bar-row list — an alternative presentation of the same real
 * sector_breakdown data as SectorBarChart, matching a simpler row-list shape. */
export function SectorRiskBars({ data }: { data: SectorBreakdown[] }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      {data.map((d) => {
        const pct = Math.round(d.avg_risk_score * 100);
        return (
          <div key={d.sector}>
            <div className="flex justify-between font-body-md text-body-md mb-1">
              <span className="text-on-surface">{t(`sectors.${d.sector}`)}</span>
              <span className="font-bold" style={{ color: SECTOR_COLOR[d.sector] }}>
                {pct}%
              </span>
            </div>
            <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: SECTOR_COLOR[d.sector] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
