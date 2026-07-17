import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import { useAlerts } from "../api/hooks";
import { RiskBadge } from "../components/RiskBadge";
import { TopBar } from "../components/TopBar";
import { Icon } from "../components/Icon";

export function AlertsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const enterpriseId = user?.enterprise_id ?? undefined;
  const { data: alerts, isLoading } = useAlerts(enterpriseId);

  return (
    <div>
      <TopBar searchPlaceholder={t("portal.searchPlaceholder")} alertsPath="/portal/alerts" />

      <h1 className="font-serif text-3xl font-bold text-text-charcoal mb-stack-lg">{t("navExtra.alerts")}</h1>

      {isLoading && <p className="font-body-md text-body-md text-slate-muted">{t("portal.loadingDashboard")}</p>}

      {alerts && alerts.length === 0 && (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg text-center">
          <Icon name="check_circle" filled size={32} className="text-success-green mb-2" />
          <p className="font-body-md text-body-md text-on-surface-variant">{t("officer.alertsEmpty")}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {alerts?.map((a) => (
          <div
            key={a.month}
            className={`rounded-xl border p-stack-md shadow-sm flex items-start gap-3 ${
              a.level === "high" ? "bg-error-container/10 border-error/30" : "bg-surface-container-lowest border-outline-variant"
            }`}
          >
            <Icon
              name={a.level === "high" ? "crisis_alert" : a.level === "medium" ? "error" : "check_circle"}
              filled
              size={22}
              className={
                a.level === "high"
                  ? "text-error flex-shrink-0 mt-0.5"
                  : a.level === "medium"
                    ? "text-secondary flex-shrink-0 mt-0.5"
                    : "text-success-green flex-shrink-0 mt-0.5"
              }
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-label-sm text-label-sm text-slate-muted">{formatMonth(a.month)}</span>
                <RiskBadge level={a.level} />
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">{a.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMonth(m: string) {
  return new Date(m).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
