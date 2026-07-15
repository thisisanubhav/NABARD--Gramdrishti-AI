import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useEnterprise,
  useFinancials,
  useForecast,
  useLoans,
  useRecommendations,
  useRisk,
} from "../api/hooks";
import { CashFlowChart } from "../components/CashFlowChart";
import { AlertBanner } from "../components/AlertBanner";
import { KpiCard } from "../components/KpiCard";
import { RiskGauge } from "../components/RiskGauge";
import { RecommendationCard } from "../components/RecommendationCard";

export function EnterpriseDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const enterpriseId = id ? Number(id) : undefined;

  const { data: enterprise } = useEnterprise(enterpriseId);
  const { data: financials } = useFinancials(enterpriseId);
  const { data: forecast } = useForecast(enterpriseId);
  const { data: risk } = useRisk(enterpriseId);
  const { data: recommendations } = useRecommendations(enterpriseId);
  const { data: loans } = useLoans(enterpriseId);

  const latest = financials?.[financials.length - 1];

  if (!enterprise || !financials || !forecast || !risk) {
    return <p className="text-sm text-slate-400">{t("officer.loadingProfile")}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/officer" className="text-xs text-slate-400 hover:text-slate-600">
          {t("officer.backToDashboard")}
        </Link>
        <h1 className="text-lg font-semibold text-slate-900 mt-1">{enterprise.name}</h1>
        <p className="text-sm text-slate-500">
          {t(`sectors.${enterprise.sector}`)} · {enterprise.district}, {enterprise.state} ·{" "}
          {t("officer.yearsInOperation", { count: enterprise.years_in_operation })} ·{" "}
          {t("officer.enterpriseSize", { size: t(`size.${enterprise.size}`) })}
        </p>
      </div>

      <AlertBanner
        level={risk.level}
        message={risk.message}
        horizonMonths={risk.horizon_months}
        drivers={risk.drivers}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label={t("kpi.cashBalance")} value={formatINR(latest?.cash_balance ?? 0)} />
        <KpiCard label={t("kpi.latestIncome")} value={formatINR(latest?.income ?? 0)} />
        <KpiCard label={t("kpi.latestExpenses")} value={formatINR(latest?.expenses ?? 0)} />
        <KpiCard
          label={t("kpi.outstandingLoans")}
          value={formatINR(loans?.reduce((sum, l) => sum + l.outstanding, 0) ?? 0)}
        />
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
        <h2 className="text-sm font-semibold text-slate-800 mb-3">{t("officer.recommendedInterventions")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {recommendations?.recommendations.map((r) => (
            <RecommendationCard key={r.title} recommendation={r} />
          ))}
        </div>
      </div>

      {loans && loans.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">{t("officer.loansTitle")}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="py-1.5 font-medium">{t("officer.colPrincipal")}</th>
                <th className="py-1.5 font-medium">{t("officer.colOutstanding")}</th>
                <th className="py-1.5 font-medium">{t("officer.colMonthlyRepayment")}</th>
                <th className="py-1.5 font-medium">{t("officer.colStatus")}</th>
                <th className="py-1.5 font-medium">{t("officer.colMissed6m")}</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id} className="border-t border-slate-100">
                  <td className="py-2">{formatINR(loan.principal)}</td>
                  <td className="py-2">{formatINR(loan.outstanding)}</td>
                  <td className="py-2">{formatINR(loan.monthly_repayment)}</td>
                  <td className="py-2 capitalize">{loan.repayment_status.replace("_", " ")}</td>
                  <td className="py-2">{loan.missed_payments_last_6m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatINR(v: number) {
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
