import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import { useFinancials } from "../api/hooks";
import { TopBar } from "../components/TopBar";

export function LedgerPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const enterpriseId = user?.enterprise_id ?? undefined;

  const { data: financials } = useFinancials(enterpriseId);
  const rows = financials ? [...financials].reverse() : [];

  if (!financials) {
    return <p className="font-body-md text-body-md text-slate-muted">{t("portal.loadingDashboard")}</p>;
  }

  return (
    <div>
      <TopBar searchPlaceholder={t("portal.searchPlaceholder")} alertsPath="/portal/alerts" />

      <h1 className="font-serif text-3xl font-bold text-text-charcoal mb-stack-lg">{t("navExtra.transactions")}</h1>

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full font-body-md text-body-md">
            <thead>
              <tr className="text-left font-label-caps text-label-caps text-slate-muted">
                <th className="px-stack-md py-2.5 font-bold">{t("portal.colMonth")}</th>
                <th className="px-stack-md py-2.5 font-bold text-right">{t("portal.income")}</th>
                <th className="px-stack-md py-2.5 font-bold text-right">{t("portal.expense")}</th>
                <th className="px-stack-md py-2.5 font-bold text-right">{t("kpi.savings")}</th>
                <th className="px-stack-md py-2.5 font-bold text-right">{t("kpi.cashBalance")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.month} className="border-t border-outline-variant">
                  <td className="px-stack-md py-2.5">{formatMonth(m.month)}</td>
                  <td className="px-stack-md py-2.5 text-right text-success-green">{formatINR(m.income)}</td>
                  <td className="px-stack-md py-2.5 text-right text-error">{formatINR(m.expenses)}</td>
                  <td className="px-stack-md py-2.5 text-right">{formatINR(m.savings)}</td>
                  <td className="px-stack-md py-2.5 text-right font-bold text-on-surface">{formatINR(m.cash_balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatINR(v: number) {
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatMonth(m: string) {
  return new Date(m).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
