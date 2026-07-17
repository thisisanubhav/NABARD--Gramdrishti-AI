import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import {
  useEnterprise,
  useFinancials,
  useForecast,
  useRecommendations,
  useRisk,
  useRiskHistory,
} from "../api/hooks";
import { CashFlowChart } from "../components/CashFlowChart";
import { AlertBanner } from "../components/AlertBanner";
import { KpiCard } from "../components/KpiCard";
import { DeltaBadge } from "../components/DeltaBadge";
import { RiskGauge } from "../components/RiskGauge";
import { RiskTimeline } from "../components/RiskTimeline";
import { RecommendationCard } from "../components/RecommendationCard";
import { TopBar } from "../components/TopBar";
import { Icon } from "../components/Icon";
import { TransactionForm } from "./TransactionForm";
import { WhatIfSimulator } from "./WhatIfSimulator";
import { usePendingTransactions } from "../offline/useOfflineQueue";
import type { ForecastPoint } from "../api/types";

export function PortalDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const enterpriseId = user?.enterprise_id ?? undefined;
  const queryClient = useQueryClient();
  const [scenario, setScenario] = useState<ForecastPoint[] | undefined>(undefined);
  const formRef = useRef<HTMLDivElement>(null);

  const { data: enterprise } = useEnterprise(enterpriseId);
  const { data: financials } = useFinancials(enterpriseId);
  const { data: forecast } = useForecast(enterpriseId);
  const { data: risk } = useRisk(enterpriseId);
  const { data: riskHistory } = useRiskHistory(enterpriseId);
  const { data: recommendations } = useRecommendations(enterpriseId);
  const pending = usePendingTransactions(enterpriseId);

  const latest = financials?.[financials.length - 1];
  const previous = financials && financials.length > 1 ? financials[financials.length - 2] : undefined;
  const topRecommendation = recommendations?.recommendations[0];
  const recentMonths = financials ? [...financials].slice(-6).reverse() : [];

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["financials", enterpriseId] });
    queryClient.invalidateQueries({ queryKey: ["forecast", enterpriseId] });
    queryClient.invalidateQueries({ queryKey: ["risk", enterpriseId] });
    queryClient.invalidateQueries({ queryKey: ["risk-history", enterpriseId] });
    queryClient.invalidateQueries({ queryKey: ["recommendations", enterpriseId] });
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (!enterprise || !financials || !forecast || !risk) {
    return <p className="font-body-md text-body-md text-slate-muted">{t("portal.loadingDashboard")}</p>;
  }

  return (
    <div className="pb-20 md:pb-0">
      <TopBar searchPlaceholder={t("portal.searchPlaceholder")} alertsPath="/portal/alerts" />

      <div className="flex items-start justify-between flex-wrap gap-stack-sm mb-stack-lg">
        <div className="flex flex-col gap-stack-sm">
          <h1 className="font-serif text-3xl font-bold text-text-charcoal">
            {t("portal.namaste", { name: enterprise.name })}
          </h1>
          <div className="flex flex-wrap gap-2">
            <span className="bg-surface-cream text-on-surface px-3 py-1 rounded-full font-label-sm text-label-sm border border-outline-variant">
              {t("portal.sectorChip", { sector: t(`sectors.${enterprise.sector}`) })}
            </span>
            <span className="bg-surface-cream text-on-surface px-3 py-1 rounded-full font-label-sm text-label-sm border border-outline-variant">
              {t("portal.districtChip", { district: enterprise.district })}
            </span>
          </div>
        </div>
        {pending && pending.length > 0 && (
          <span className="flex items-center gap-1.5 font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-secondary-container/20 text-secondary border border-secondary-container/40">
            <Icon name="cloud_off" size={14} />
            {t("portal.queuedOne", { count: pending.length })}
          </span>
        )}
      </div>

      <div className="mb-stack-lg">
        <AlertBanner
          level={risk.level}
          message={risk.message}
          horizonMonths={risk.horizon_months}
          drivers={risk.drivers}
        />
      </div>

      <div className="grid grid-cols-2 gap-stack-md mb-stack-lg">
        <KpiCard
          label={t("kpi.cashBalance")}
          value={formatINR(latest?.cash_balance ?? 0)}
          delta={<DeltaBadge current={latest?.cash_balance ?? 0} previous={previous?.cash_balance} />}
        />
        <KpiCard
          label={t("kpi.thisMonthIncome")}
          value={formatINR(latest?.income ?? 0)}
          delta={<DeltaBadge current={latest?.income ?? 0} previous={previous?.income} />}
        />
        <KpiCard
          label={t("kpi.thisMonthExpenses")}
          value={formatINR(latest?.expenses ?? 0)}
          delta={<DeltaBadge current={latest?.expenses ?? 0} previous={previous?.expenses} invert />}
        />
        <KpiCard
          label={t("kpi.savings")}
          value={formatINR(latest?.savings ?? 0)}
          delta={<DeltaBadge current={latest?.savings ?? 0} previous={previous?.savings} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg mb-stack-lg">
        <div className="lg:col-span-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm">
          <h2 className="font-headline-md text-headline-md text-text-charcoal mb-stack-sm">{t("chart.cashFlowTitle")}</h2>
          <CashFlowChart history={financials} forecast={forecast.forecast} scenario={scenario} />
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm">
          <h2 className="font-headline-md text-headline-md text-text-charcoal mb-stack-sm">{t("chart.riskScoreTitle")}</h2>
          <RiskGauge level={risk.level} score={risk.score} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-lg mb-stack-lg">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm">
          <h2 className="font-headline-md text-headline-md text-text-charcoal mb-stack-sm">{t("timeline.title")}</h2>
          <RiskTimeline history={riskHistory?.history ?? []} />
        </div>
        <WhatIfSimulator
          enterpriseId={enterpriseId}
          baselineRiskLevel={risk.level}
          onScenarioChange={setScenario}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-lg mb-stack-lg">
        {topRecommendation && (
          <section className="bg-primary-container/40 rounded-xl border border-primary/20 p-stack-md shadow-sm">
            <h3 className="font-label-caps text-label-caps text-primary mb-stack-md flex items-center gap-2">
              <Icon name="bolt" filled size={18} />
              {t("portal.smartActions")}
            </h3>
            <blockquote className="border-l-4 border-primary pl-4">
              <p className="font-headline-md text-headline-md text-text-charcoal mb-1">{topRecommendation.title}</p>
              <p className="font-body-md text-body-md text-on-surface-variant">{topRecommendation.detail}</p>
            </blockquote>
          </section>
        )}

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm overflow-hidden">
          <h3 className="font-label-caps text-label-caps text-slate-muted p-stack-md pb-2">{t("portal.recentMonths")}</h3>
          <div className="overflow-x-auto">
            <table className="w-full font-body-md text-body-md">
              <thead>
                <tr className="text-left font-label-caps text-label-caps text-slate-muted">
                  <th className="px-stack-md py-1.5 font-bold">{t("portal.colMonth")}</th>
                  <th className="px-stack-md py-1.5 font-bold text-right">{t("portal.income")}</th>
                  <th className="px-stack-md py-1.5 font-bold text-right">{t("portal.expense")}</th>
                  <th className="px-stack-md py-1.5 font-bold text-right">{t("kpi.cashBalance")}</th>
                </tr>
              </thead>
              <tbody>
                {recentMonths.map((m) => (
                  <tr key={m.month} className="border-t border-outline-variant">
                    <td className="px-stack-md py-2">{formatMonth(m.month)}</td>
                    <td className="px-stack-md py-2 text-right text-success-green">{formatINR(m.income)}</td>
                    <td className="px-stack-md py-2 text-right text-error">{formatINR(m.expenses)}</td>
                    <td className="px-stack-md py-2 text-right font-bold text-on-surface">{formatINR(m.cash_balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <section className="bg-surface-cream p-stack-md rounded-xl border border-outline-variant mb-stack-lg">
        <h2 className="font-headline-md text-headline-md text-text-charcoal mb-stack-sm flex items-center gap-2">
          <Icon name="lightbulb" filled className="text-primary" />
          {t("portal.recommendationsForYou")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-stack-sm">
          {recommendations?.recommendations.map((r) => (
            <RecommendationCard key={r.title} recommendation={r} />
          ))}
        </div>
      </section>

      <div ref={formRef} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm scroll-mt-20">
        <h2 className="font-headline-md text-headline-md text-text-charcoal mb-stack-sm">{t("portal.recordEntryTitle")}</h2>
        <TransactionForm enterpriseId={enterpriseId} onRecorded={refreshAll} />
      </div>

      {/* FAB — quick access to the entry form, mobile only */}
      <button
        onClick={scrollToForm}
        aria-label={t("portal.recordEntryTitle")}
        className="md:hidden fixed bottom-[96px] right-margin-mobile w-[56px] h-[56px] bg-primary text-on-primary rounded-2xl shadow-lg flex items-center justify-center hover:bg-primary-container active:scale-95 transition-transform z-40"
      >
        <Icon name="add" size={28} />
      </button>
    </div>
  );
}

function formatINR(v: number) {
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatMonth(m: string) {
  return new Date(m).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
