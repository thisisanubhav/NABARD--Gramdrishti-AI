import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useOfficerAlerts } from "../api/hooks";
import { RiskBadge } from "../components/RiskBadge";
import { TopBar } from "../components/TopBar";
import { Icon } from "../components/Icon";

export function OfficerAlertsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: alerts, isLoading } = useOfficerAlerts();

  return (
    <div>
      <TopBar searchPlaceholder={t("officer.searchPlaceholder")} alertsPath="/officer/alerts" />

      <h1 className="font-serif text-3xl font-bold text-text-charcoal mb-1">{t("navExtra.alerts")}</h1>
      <p className="font-body-md text-body-md text-slate-muted mb-stack-lg">
        {t("officer.alertsSubtitle", { count: alerts?.length ?? 0 })}
      </p>

      {isLoading && <p className="font-body-md text-body-md text-slate-muted">{t("officer.loadingEnterprises")}</p>}

      {alerts && alerts.length === 0 && (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg text-center">
          <Icon name="check_circle" filled size={32} className="text-success-green mb-2" />
          <p className="font-body-md text-body-md text-on-surface-variant">{t("officer.alertsEmpty")}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {alerts?.map((a) => (
          <button
            key={a.enterprise_id}
            onClick={() => navigate(`/officer/enterprise/${a.enterprise_id}`)}
            className={`text-left rounded-xl border p-stack-md shadow-sm flex items-start gap-3 transition-colors hover:bg-surface-cream ${
              a.level === "high" ? "bg-error-container/10 border-error/30" : "bg-surface-container-lowest border-outline-variant"
            }`}
          >
            <Icon
              name={a.level === "high" ? "crisis_alert" : "error"}
              filled
              size={22}
              className={a.level === "high" ? "text-error flex-shrink-0 mt-0.5" : "text-secondary flex-shrink-0 mt-0.5"}
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-headline-md text-headline-md text-on-surface">{a.enterprise_name}</h3>
                <RiskBadge level={a.level} />
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">{a.message}</p>
            </div>
            <Icon name="chevron_right" className="text-primary flex-shrink-0 mt-1" />
          </button>
        ))}
      </div>
    </div>
  );
}
