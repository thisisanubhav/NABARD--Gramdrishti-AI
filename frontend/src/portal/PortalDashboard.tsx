import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import {
  useEnterprise,
  useFinancials,
  useForecast,
  useRecommendations,
  useRisk,
} from "../api/hooks";
import { CashFlowChart } from "../components/CashFlowChart";
import { AlertBanner } from "../components/AlertBanner";
import { KpiCard } from "../components/KpiCard";
import { RiskGauge } from "../components/RiskGauge";
import { RecommendationCard } from "../components/RecommendationCard";
import { TransactionForm } from "./TransactionForm";
import { usePendingTransactions } from "../offline/useOfflineQueue";

export function PortalDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const enterpriseId = user?.enterprise_id ?? undefined;
  const queryClient = useQueryClient();

  const { data: enterprise } = useEnterprise(enterpriseId);
  const { data: financials } = useFinancials(enterpriseId);
  const { data: forecast } = useForecast(enterpriseId);
  const { data: risk } = useRisk(enterpriseId);
  const { data: recommendations } = useRecommendations(enterpriseId);
  const pending = usePendingTransactions(enterpriseId);

  const latest = financials?.[financials.length - 1];

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["financials", enterpriseId] });
    queryClient.invalidateQueries({ queryKey: ["forecast", enterpriseId] });
    queryClient.invalidateQueries({ queryKey: ["risk", enterpriseId] });
    queryClient.invalidateQueries({ queryKey: ["recommendations", enterpriseId] });
  };

  if (!enterprise || !financials || !forecast || !risk) {
    return <p className="text-sm text-slate-400">{t("portal.loadingDashboard")}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{enterprise.name}</h1>
          <p className="text-sm text-slate-500">
            {t(`sectors.${enterprise.sector}`)} · {enterprise.district}, {enterprise.state}
          </p>
        </div>
        {pending && pending.length > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
            {t("portal.queuedOne", { count: pending.length })}
          </span>
        )}
      </div>

      <AlertBanner
        level={risk.level}
        message={risk.message}
        horizonMonths={risk.horizon_months}
        drivers={risk.drivers}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label={t("kpi.cashBalance")} value={formatINR(latest?.cash_balance ?? 0)} />
        <KpiCard label={t("kpi.thisMonthIncome")} value={formatINR(latest?.income ?? 0)} />
        <KpiCard label={t("kpi.thisMonthExpenses")} value={formatINR(latest?.expenses ?? 0)} />
        <KpiCard label={t("kpi.savings")} value={formatINR(latest?.savings ?? 0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">{t("chart.cashFlowTitle")}</h2>
          <CashFlowChart history={financials} forecast={forecast.forecast} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">{t("chart.riskScoreTitle")}</h2>
          <RiskGauge level={risk.level} score={risk.score} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-3">{t("portal.recommendationsForYou")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {recommendations?.recommendations.map((r) => (
            <RecommendationCard key={r.title} recommendation={r} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">{t("portal.recordEntryTitle")}</h2>
        <TransactionForm enterpriseId={enterpriseId} onRecorded={refreshAll} />
      </div>
    </div>
  );
}

function formatINR(v: number) {
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
