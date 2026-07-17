import { useTranslation } from "react-i18next";
import { RISK_COLOR, RISK_LEVEL_KEY } from "../theme";
import type { RiskHistoryPoint } from "../api/types";

function formatMonth(m: string) {
  return new Date(m).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export function RiskTimeline({ history }: { history: RiskHistoryPoint[] }) {
  const { t } = useTranslation();

  if (history.length === 0) {
    return <p className="font-body-md text-body-md text-slate-muted">{t("timeline.empty")}</p>;
  }

  const transitions = history.filter((point, i) => i > 0 && point.level !== history[i - 1].level);

  return (
    <div>
      <div className="flex items-end gap-1.5">
        {history.map((point) => (
          <div key={point.month} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <div
              className="w-full h-8 rounded-md"
              style={{ backgroundColor: RISK_COLOR[point.level] }}
              title={`${formatMonth(point.month)}: ${t(RISK_LEVEL_KEY[point.level])} (${Math.round(point.score * 100)}%)`}
            />
            <span className="font-label-caps text-[10px] text-slate-muted truncate w-full text-center">
              {formatMonth(point.month)}
            </span>
          </div>
        ))}
      </div>

      {transitions.length > 0 ? (
        <ul className="mt-4 space-y-1.5">
          {transitions.map((point) => {
            const prevIdx = history.indexOf(point) - 1;
            const prev = history[prevIdx];
            const worsened =
              ["low", "medium", "high"].indexOf(point.level) > ["low", "medium", "high"].indexOf(prev.level);
            return (
              <li key={point.month} className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: RISK_COLOR[point.level] }}
                />
                <span>
                  {t(worsened ? "timeline.worsened" : "timeline.improved", {
                    from: t(RISK_LEVEL_KEY[prev.level]),
                    to: t(RISK_LEVEL_KEY[point.level]),
                    month: formatMonth(point.month),
                  })}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 font-label-sm text-label-sm text-slate-muted">{t("timeline.noChange")}</p>
      )}
    </div>
  );
}
