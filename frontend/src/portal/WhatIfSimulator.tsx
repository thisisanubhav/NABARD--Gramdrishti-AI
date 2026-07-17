import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSimulate } from "../api/hooks";
import { RiskBadge } from "../components/RiskBadge";
import type { ForecastPoint, RiskLevel } from "../api/types";

const STEP = 5;
const MIN = -50;
const MAX = 50;

export function WhatIfSimulator({
  enterpriseId,
  baselineRiskLevel,
  onScenarioChange,
}: {
  enterpriseId: number | undefined;
  baselineRiskLevel: RiskLevel;
  onScenarioChange: (forecast: ForecastPoint[] | undefined) => void;
}) {
  const { t } = useTranslation();
  const [incomePct, setIncomePct] = useState(0);
  const [expensePct, setExpensePct] = useState(0);
  const simulate = useSimulate(enterpriseId);
  const isActive = incomePct !== 0 || expensePct !== 0;

  useEffect(() => {
    if (!isActive) {
      onScenarioChange(undefined);
      return;
    }
    const handle = setTimeout(() => {
      simulate.mutate(
        { income_change_pct: incomePct, expense_change_pct: expensePct },
        { onSuccess: (data) => onScenarioChange(data.forecast) }
      );
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomePct, expensePct]);

  const reset = () => {
    setIncomePct(0);
    setExpensePct(0);
  };

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-headline-md text-headline-md text-text-charcoal">{t("simulator.title")}</h2>
        {isActive && (
          <button onClick={reset} className="font-label-sm text-label-sm text-slate-muted hover:text-on-surface">
            {t("simulator.reset")}
          </button>
        )}
      </div>
      <p className="font-label-sm text-label-sm text-slate-muted mb-stack-md">{t("simulator.subtitle")}</p>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between font-label-sm text-label-sm text-slate-muted mb-1.5">
            <span>{t("simulator.incomeChange")}</span>
            <span
              className={`font-bold tabular-nums ${
                incomePct > 0 ? "text-success-green" : incomePct < 0 ? "text-error" : "text-slate-muted"
              }`}
            >
              {incomePct > 0 ? "+" : ""}
              {incomePct}%
            </span>
          </div>
          <input
            type="range"
            min={MIN}
            max={MAX}
            step={STEP}
            value={incomePct}
            onChange={(e) => setIncomePct(Number(e.target.value))}
            className="w-full accent-primary"
            aria-label={t("simulator.incomeChange")}
          />
        </div>
        <div>
          <div className="flex justify-between font-label-sm text-label-sm text-slate-muted mb-1.5">
            <span>{t("simulator.expenseChange")}</span>
            <span
              className={`font-bold tabular-nums ${
                expensePct > 0 ? "text-error" : expensePct < 0 ? "text-success-green" : "text-slate-muted"
              }`}
            >
              {expensePct > 0 ? "+" : ""}
              {expensePct}%
            </span>
          </div>
          <input
            type="range"
            min={MIN}
            max={MAX}
            step={STEP}
            value={expensePct}
            onChange={(e) => setExpensePct(Number(e.target.value))}
            className="w-full accent-primary"
            aria-label={t("simulator.expenseChange")}
          />
        </div>
      </div>

      {isActive && simulate.isPending && (
        <p className="mt-4 font-label-sm text-label-sm text-slate-muted">{t("simulator.calculating")}</p>
      )}

      {isActive && simulate.data && !simulate.isPending && (
        <div className="mt-4 pt-4 border-t border-outline-variant/50">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-label-sm text-label-sm text-slate-muted">{t("simulator.resultLabel")}</span>
            <RiskBadge level={simulate.data.risk_level} />
            {simulate.data.risk_level !== baselineRiskLevel && (
              <span className="font-label-sm text-label-sm text-slate-muted">{t("simulator.changedFromBaseline")}</span>
            )}
          </div>
          {simulate.data.recommendations.length > 0 && (
            <ul className="space-y-1">
              {simulate.data.recommendations.slice(0, 2).map((r) => (
                <li key={r.title} className="font-label-sm text-label-sm text-on-surface-variant flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-muted flex-shrink-0 mt-1.5" />
                  {r.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
