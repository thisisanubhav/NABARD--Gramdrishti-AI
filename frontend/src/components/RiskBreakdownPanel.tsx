import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";
import type { Recommendation, RiskOut } from "../api/types";

export const DRIVER_ICON: Record<string, string> = {
  income_trend_3m: "trending_down",
  expense_income_ratio: "payments",
  cash_buffer_months: "savings",
  upi_txn_trend_3m: "contactless",
  missed_payments_last_6m_max: "event_busy",
  has_defaulted: "gavel",
  savings_ratio: "savings",
  commodity_price_index: "trending_up",
  demand_index: "storefront",
  rainfall_mm: "rainy",
  drought_flag: "water_drop",
  flood_flag: "flood",
  loan_repayment_burden: "account_balance_wallet",
  income_roll3_std: "show_chart",
  outstanding_loan_total: "account_balance",
};

/** Real relative-contribution % from the top SHAP risk drivers, paired with
 * the top recommendation — shared between the officer's Enterprise Detail
 * drill-down and the owner's own Risk Analysis page. */
export function RiskBreakdownPanel({
  risk,
  topRecommendation,
}: {
  risk: RiskOut;
  topRecommendation: Recommendation | undefined;
}) {
  const { t } = useTranslation();
  const topDrivers = risk.drivers
    .filter((d) => d.direction === "increases_risk")
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 3);
  const driverTotal = topDrivers.reduce((sum, d) => sum + Math.abs(d.impact), 0) || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-lg">
      {topDrivers.length > 0 && (
        <section className="bg-surface-cream rounded-xl border border-outline-variant p-stack-md shadow-sm">
          <h3 className="font-label-caps text-label-caps text-slate-muted mb-stack-md flex items-center gap-2">
            <Icon name="psychology" size={18} />
            {t("officer.aiRiskBreakdown")}
          </h3>
          <div className="flex flex-col gap-4">
            {topDrivers.map((d) => {
              const pct = Math.round((Math.abs(d.impact) / driverTotal) * 100);
              return (
                <div key={d.feature}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name={DRIVER_ICON[d.feature] ?? "info"} size={18} className="text-secondary" />
                    <span className="font-body-md text-body-md text-on-surface flex-1">{d.label}</span>
                    <span className="font-label-sm text-label-sm font-bold text-error">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-error" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {topRecommendation && (
        <section className="bg-primary-container/40 rounded-xl border border-primary/20 p-stack-md shadow-sm flex flex-col">
          <h3 className="font-label-caps text-label-caps text-primary mb-stack-md flex items-center gap-2">
            <Icon name="lightbulb" filled size={18} />
            {t("officer.recommendedAction")}
          </h3>
          <blockquote className="border-l-4 border-primary pl-4">
            <p className="font-headline-md text-headline-md text-text-charcoal mb-1">{topRecommendation.title}</p>
            <p className="font-body-md text-body-md text-on-surface-variant">{topRecommendation.detail}</p>
          </blockquote>
        </section>
      )}
    </div>
  );
}
