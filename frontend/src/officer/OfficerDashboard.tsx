import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useOfficerEnterprises, useOfficerSummary } from "../api/hooks";
import { KpiCard } from "../components/KpiCard";
import { RiskBadge } from "../components/RiskBadge";
import { SectorBarChart } from "../components/SectorBarChart";
import { RISK_COLOR, SECTORS } from "../theme";
import type { RiskLevel, Sector } from "../api/types";

export function OfficerDashboard() {
  const { t } = useTranslation();
  const [sector, setSector] = useState<Sector | "">("");
  const [risk, setRisk] = useState<RiskLevel | "">("");
  const navigate = useNavigate();

  const { data: summary } = useOfficerSummary();
  const { data: rows, isLoading } = useOfficerEnterprises({
    sector: sector || undefined,
    risk: risk || undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{t("officer.dashboardTitle")}</h1>
        <p className="text-sm text-slate-500">
          {t("officer.monitoring", { count: summary?.total_enterprises ?? 0 })}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label={t("officer.totalEnterprises")} value={String(summary?.total_enterprises ?? "—")} />
        <KpiCard
          label={t("officer.highRisk")}
          value={String(summary?.high_risk_count ?? "—")}
          accent={RISK_COLOR.high}
        />
        <KpiCard
          label={t("officer.mediumRisk")}
          value={String(summary?.medium_risk_count ?? "—")}
          accent={RISK_COLOR.medium}
        />
        <KpiCard
          label={t("officer.lowRisk")}
          value={String(summary?.low_risk_count ?? "—")}
          accent={RISK_COLOR.low}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">{t("chart.avgRiskBySector")}</h2>
        {summary && <SectorBarChart data={summary.sector_breakdown} />}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800 mr-auto">
            {t("officer.prioritizedList")}
          </h2>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value as Sector | "")}
            className="text-sm rounded-lg border border-slate-300 px-2.5 py-1.5"
          >
            <option value="">{t("officer.allSectors")}</option>
            {SECTORS.map((value) => (
              <option key={value} value={value}>
                {t(`sectors.${value}`)}
              </option>
            ))}
          </select>
          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value as RiskLevel | "")}
            className="text-sm rounded-lg border border-slate-300 px-2.5 py-1.5"
          >
            <option value="">{t("officer.allRiskLevels")}</option>
            <option value="high">{t("risk.high")}</option>
            <option value="medium">{t("risk.medium")}</option>
            <option value="low">{t("risk.low")}</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-4 py-2 font-medium">{t("officer.colEnterprise")}</th>
                <th className="px-4 py-2 font-medium">{t("officer.colSector")}</th>
                <th className="px-4 py-2 font-medium">{t("officer.colLocation")}</th>
                <th className="px-4 py-2 font-medium">{t("officer.colRisk")}</th>
                <th className="px-4 py-2 font-medium">{t("officer.colMainDriver")}</th>
                <th className="px-4 py-2 font-medium text-right">{t("officer.colCashBalance")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    {t("officer.loadingEnterprises")}
                  </td>
                </tr>
              )}
              {rows?.map((row) => (
                <tr
                  key={row.enterprise_id}
                  onClick={() => navigate(`/officer/enterprise/${row.enterprise_id}`)}
                  className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-800">{row.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{t(`sectors.${row.sector}`)}</td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {row.district}, {row.state}
                  </td>
                  <td className="px-4 py-2.5">
                    <RiskBadge level={row.risk_level} />
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{row.top_driver}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                    ₹{row.cash_balance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
