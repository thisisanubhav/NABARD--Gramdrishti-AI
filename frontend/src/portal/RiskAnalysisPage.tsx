import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import { useRecommendations, useRisk, useRiskHistory } from "../api/hooks";
import { StressGauge } from "../components/StressGauge";
import { RiskTimeline } from "../components/RiskTimeline";
import { RiskBreakdownPanel } from "../components/RiskBreakdownPanel";
import { TopBar } from "../components/TopBar";

export function RiskAnalysisPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const enterpriseId = user?.enterprise_id ?? undefined;

  const { data: risk } = useRisk(enterpriseId);
  const { data: riskHistory } = useRiskHistory(enterpriseId);
  const { data: recommendations } = useRecommendations(enterpriseId);
  const topRecommendation = recommendations?.recommendations[0];

  if (!risk) {
    return <p className="font-body-md text-body-md text-slate-muted">{t("portal.loadingDashboard")}</p>;
  }

  return (
    <div>
      <TopBar searchPlaceholder={t("portal.searchPlaceholder")} alertsPath="/portal/alerts" />

      <h1 className="font-serif text-3xl font-bold text-text-charcoal mb-stack-lg">{t("navExtra.riskAnalysis")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg mb-stack-lg">
        <div className="lg:col-span-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm">
          <h2 className="font-headline-md text-headline-md text-text-charcoal mb-stack-sm">{t("timeline.title")}</h2>
          <RiskTimeline history={riskHistory?.history ?? []} />
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm flex flex-col items-center justify-center">
          <h2 className="font-headline-md text-headline-md text-text-charcoal mb-stack-sm self-start">{t("chart.riskScoreTitle")}</h2>
          <StressGauge level={risk.level} score={risk.score} />
        </div>
      </div>

      <RiskBreakdownPanel risk={risk} topRecommendation={topRecommendation} />
    </div>
  );
}
