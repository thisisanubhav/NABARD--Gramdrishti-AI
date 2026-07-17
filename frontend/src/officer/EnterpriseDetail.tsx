import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useEnterprise,
  useFinancials,
  useForecast,
  useLoans,
  useRecommendations,
  useRisk,
  useRiskHistory,
} from "../api/hooks";
import { CashFlowChart } from "../components/CashFlowChart";
import { AlertBanner } from "../components/AlertBanner";
import { KpiCard } from "../components/KpiCard";
import { RiskBadge } from "../components/RiskBadge";
import { StressGauge } from "../components/StressGauge";
import { RiskTimeline } from "../components/RiskTimeline";
import { RecommendationCard } from "../components/RecommendationCard";
import { Breadcrumb } from "../components/Breadcrumb";
import { TopBar } from "../components/TopBar";
import { RiskBreakdownPanel } from "../components/RiskBreakdownPanel";
import { Icon } from "../components/Icon";

export function EnterpriseDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const enterpriseId = id ? Number(id) : undefined;

  const { data: enterprise } = useEnterprise(enterpriseId);
  const { data: financials } = useFinancials(enterpriseId);
  const { data: forecast } = useForecast(enterpriseId);
  const { data: risk } = useRisk(enterpriseId);
  const { data: riskHistory } = useRiskHistory(enterpriseId);
  const { data: recommendations } = useRecommendations(enterpriseId);
  const { data: loans } = useLoans(enterpriseId);

  const latest = financials?.[financials.length - 1];

  const totalPrincipal = loans?.reduce((sum, l) => sum + l.principal, 0) ?? 0;
  const totalOutstanding = loans?.reduce((sum, l) => sum + l.outstanding, 0) ?? 0;
  const totalRepayment = loans?.reduce((sum, l) => sum + l.monthly_repayment, 0) ?? 0;
  const totalMissed = loans?.reduce((sum, l) => sum + l.missed_payments_last_6m, 0) ?? 0;

  const topRecommendation = recommendations?.recommendations[0];

  if (!enterprise || !financials || !forecast || !risk) {
    return <p className="font-body-md text-body-md text-slate-muted">{t("officer.loadingProfile")}</p>;
  }

  return (
    <div>
      <TopBar searchPlaceholder={t("officer.searchPlaceholder")} alertsPath="/officer/alerts" />

      <Breadcrumb items={[{ label: t("navExtra.enterprisePortfolio"), to: "/officer" }, { label: enterprise.name }]} />

      {/* Profile header — no hero photo (no photo data exists to show honestly) */}
      <section className="mb-stack-lg">
        <h1 className="font-serif text-3xl font-bold text-text-charcoal mb-1">{enterprise.name}</h1>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body-md text-body-md text-slate-muted mb-2">
          <Icon name="category" size={16} />
          <span>{t(`sectors.${enterprise.sector}`)}</span>
          <span className="px-1">•</span>
          <Icon name="location_on" size={16} />
          <span>
            {enterprise.district}, {enterprise.state}
          </span>
          <span className="px-1">•</span>
          <span>{t("officer.yearsInOperation", { count: enterprise.years_in_operation })}</span>
          <span className="px-1">•</span>
          <span className="font-label-sm text-label-sm">ENT-{enterprise.id}</span>
        </div>
        <RiskBadge level={risk.level} />
      </section>

      {/* Intervention banner: bold treatment for high risk, tinted for medium/low */}
      {risk.level === "high" ? (
        <div className="bg-error border border-error text-on-error p-stack-md rounded-lg flex gap-3 items-start shadow-sm mb-stack-lg">
          <Icon name="crisis_alert" filled className="mt-1" />
          <div>
            <h3 className="font-headline-md text-headline-md mb-1">{t("officer.urgentIntervention")}</h3>
            <p className="font-body-md text-body-md opacity-90">{risk.message}</p>
          </div>
        </div>
      ) : (
        <div className="mb-stack-lg">
          <AlertBanner level={risk.level} message={risk.message} horizonMonths={risk.horizon_months} drivers={risk.drivers} />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-stack-md mb-stack-lg">
        <KpiCard label={t("kpi.cashBalance")} value={formatINR(latest?.cash_balance ?? 0)} />
        <KpiCard label={t("kpi.latestIncome")} value={formatINR(latest?.income ?? 0)} />
        <KpiCard label={t("kpi.latestExpenses")} value={formatINR(latest?.expenses ?? 0)} />
        <KpiCard label={t("kpi.outstandingLoans")} value={formatINR(totalOutstanding)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg mb-stack-lg">
        <div className="lg:col-span-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm">
          <h2 className="font-headline-md text-headline-md text-text-charcoal mb-stack-sm">{t("chart.cashFlowTitle")}</h2>
          <CashFlowChart history={financials} forecast={forecast.forecast} />
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm flex flex-col items-center justify-center">
          <h2 className="font-headline-md text-headline-md text-text-charcoal mb-stack-sm self-start">{t("chart.riskScoreTitle")}</h2>
          <StressGauge level={risk.level} score={risk.score} />
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm mb-stack-lg">
        <h2 className="font-headline-md text-headline-md text-text-charcoal mb-stack-sm">{t("timeline.title")}</h2>
        <RiskTimeline history={riskHistory?.history ?? []} />
      </div>

      <div className="mb-stack-lg">
        <RiskBreakdownPanel risk={risk} topRecommendation={topRecommendation} />
      </div>

      <div className="mb-stack-lg">
        <h2 className="font-headline-md text-headline-md text-text-charcoal mb-stack-sm">{t("officer.recommendedInterventions")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-stack-sm">
          {recommendations?.recommendations.map((r) => (
            <RecommendationCard key={r.title} recommendation={r} />
          ))}
        </div>
      </div>

      {loans && loans.length > 0 && (
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-stack-md shadow-sm mb-stack-lg">
          <h3 className="font-label-caps text-label-caps text-slate-muted mb-stack-md">{t("officer.loanStatus")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-stack-md">
            <div className="rounded-lg border border-outline-variant p-3">
              <p className="font-label-sm text-label-sm text-slate-muted mb-1">{t("officer.colPrincipal")}</p>
              <p className="font-kpi-number text-kpi-number text-text-charcoal">{formatINR(totalPrincipal)}</p>
            </div>
            <div className="rounded-lg border border-outline-variant p-3">
              <p className="font-label-sm text-label-sm text-slate-muted mb-1">{t("officer.colOutstanding")}</p>
              <p className="font-kpi-number text-kpi-number text-error">{formatINR(totalOutstanding)}</p>
            </div>
            <div className="rounded-lg border border-outline-variant p-3">
              <p className="font-label-sm text-label-sm text-slate-muted mb-1">{t("officer.colMonthlyRepayment")}</p>
              <p className="font-kpi-number text-kpi-number text-text-charcoal">{formatINR(totalRepayment)}</p>
            </div>
          </div>
          {totalMissed > 0 && (
            <div className="mt-4 pt-4 border-t border-outline-variant flex items-center gap-2 text-error">
              <Icon name="info" filled size={20} />
              <span className="font-body-md text-body-md font-medium">
                {t("officer.missedPaymentsDetected", { count: totalMissed })}
              </span>
            </div>
          )}

          <div className="hidden sm:block overflow-x-auto mt-4">
            <table className="w-full font-body-md text-body-md">
              <thead>
                <tr className="text-left font-label-caps text-label-caps text-slate-muted">
                  <th className="py-1.5 pr-4 font-bold">{t("officer.colPrincipal")}</th>
                  <th className="py-1.5 pr-4 font-bold">{t("officer.colOutstanding")}</th>
                  <th className="py-1.5 pr-4 font-bold">{t("officer.colMonthlyRepayment")}</th>
                  <th className="py-1.5 pr-4 font-bold">{t("officer.colStatus")}</th>
                  <th className="py-1.5 font-bold">{t("officer.colMissed6m")}</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id} className="border-t border-outline-variant">
                    <td className="py-2 pr-4">{formatINR(loan.principal)}</td>
                    <td className="py-2 pr-4">{formatINR(loan.outstanding)}</td>
                    <td className="py-2 pr-4">{formatINR(loan.monthly_repayment)}</td>
                    <td className="py-2 pr-4 capitalize">{loan.repayment_status.replace("_", " ")}</td>
                    <td className="py-2">{loan.missed_payments_last_6m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden divide-y divide-outline-variant mt-2">
            {loans.map((loan) => (
              <div key={loan.id} className="py-3 first:pt-0 grid grid-cols-2 gap-y-1.5 gap-x-3 font-body-md text-body-md">
                <div className="font-label-caps text-label-caps text-slate-muted">{t("officer.colPrincipal")}</div>
                <div className="font-label-caps text-label-caps text-slate-muted">{t("officer.colOutstanding")}</div>
                <div>{formatINR(loan.principal)}</div>
                <div>{formatINR(loan.outstanding)}</div>
                <div className="font-label-caps text-label-caps text-slate-muted mt-1.5">{t("officer.colMonthlyRepayment")}</div>
                <div className="font-label-caps text-label-caps text-slate-muted mt-1.5">{t("officer.colStatus")}</div>
                <div>{formatINR(loan.monthly_repayment)}</div>
                <div className="capitalize">{loan.repayment_status.replace("_", " ")}</div>
                <div className="font-label-caps text-label-caps text-slate-muted mt-1.5">{t("officer.colMissed6m")}</div>
                <div className="col-start-1">{loan.missed_payments_last_6m}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function formatINR(v: number) {
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
