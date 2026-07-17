import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useClimateFlags, useOfficerEnterprises, useOfficerSummary } from "../api/hooks";
import { RiskBadge } from "../components/RiskBadge";
import { SectorRiskBars } from "../components/SectorRiskBars";
import { DistrictRiskBars, type DistrictRisk } from "../components/DistrictRiskBars";
import { TopBar } from "../components/TopBar";
import { Icon } from "../components/Icon";
import { SECTORS } from "../theme";
import type { RiskLevel, Sector } from "../api/types";

const MAX_DISTRICTS_SHOWN = 8;

const RISK_META: Record<RiskLevel, { icon: string; color: string; bg: string }> = {
  high: { icon: "warning", color: "text-error", bg: "border-error" },
  medium: { icon: "error", color: "text-secondary", bg: "border-secondary" },
  low: { icon: "check_circle", color: "text-success-green", bg: "border-success-green" },
};

export function OfficerDashboard() {
  const { t } = useTranslation();
  const [sector, setSector] = useState<Sector | "">("");
  const [risk, setRisk] = useState<RiskLevel | "">("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data: summary } = useOfficerSummary();
  const { data: climateFlags } = useClimateFlags();
  const { data: rows, isLoading } = useOfficerEnterprises({
    sector: sector || undefined,
    risk: risk || undefined,
  });

  const filteredRows = useMemo(() => {
    if (!rows) return rows;
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const districtBreakdown: DistrictRisk[] = useMemo(() => {
    if (!filteredRows) return [];
    const byDistrict = new Map<string, { district: string; state: string; total: number; count: number }>();
    for (const r of filteredRows) {
      const key = `${r.district}|${r.state}`;
      const entry = byDistrict.get(key) ?? { district: r.district, state: r.state, total: 0, count: 0 };
      entry.total += r.risk_score;
      entry.count += 1;
      byDistrict.set(key, entry);
    }
    return Array.from(byDistrict.values())
      .map((e) => ({ district: e.district, state: e.state, count: e.count, avgRiskScore: e.total / e.count }))
      .sort((a, b) => b.avgRiskScore - a.avgRiskScore)
      .slice(0, MAX_DISTRICTS_SHOWN);
  }, [filteredRows]);

  return (
    <div>
      <TopBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("officer.searchPlaceholder")}
        alertsPath="/officer/alerts"
      />

      <div className="mb-stack-lg">
        <h1 className="font-serif text-3xl font-bold text-text-charcoal">{t("officer.dashboardTitle")}</h1>
        <p className="font-body-md text-body-md text-slate-muted mt-1">
          {t("officer.monitoringLong", { count: summary?.total_enterprises ?? 0 })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-md mb-stack-lg">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm flex flex-col justify-between">
          <p className="font-label-caps text-label-caps text-slate-muted uppercase">{t("officer.totalEnterprises")}</p>
          <div className="flex items-end justify-between mt-2">
            <span className="font-kpi-number text-kpi-number text-text-charcoal">{summary?.total_enterprises ?? "—"}</span>
            <Icon name="groups" size={28} className="text-slate-muted" />
          </div>
        </div>
        <div className="md:col-span-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm">
          <p className="font-label-caps text-label-caps text-slate-muted uppercase mb-3">{t("officer.riskDistribution")}</p>
          <div className="grid grid-cols-3 gap-4">
            {(["high", "medium", "low"] as RiskLevel[]).map((level) => (
              <div key={level} className={`border-l-4 pl-3 ${RISK_META[level].bg}`}>
                <div className={`flex items-center gap-1.5 font-label-sm text-label-sm font-bold uppercase ${RISK_META[level].color}`}>
                  <Icon name={RISK_META[level].icon} filled size={16} />
                  {t(`risk.level${level.charAt(0).toUpperCase() + level.slice(1)}`)}
                </div>
                <p className="font-kpi-number text-kpi-number text-text-charcoal mt-1">
                  {summary?.[`${level}_risk_count` as const] ?? "—"}
                </p>
                <p className="font-label-sm text-label-sm text-slate-muted">{t(`officer.riskCaption.${level}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm">
        <h2 className="font-headline-md text-headline-md text-text-charcoal mb-1 flex items-center gap-2">
          <Icon name="location_on" size={20} className="text-primary" />
          {t("officer.riskByDistrict")}
        </h2>
        <p className="font-label-sm text-label-sm text-slate-muted mb-stack-md">{t("officer.riskByDistrictDesc")}</p>
        <DistrictRiskBars data={districtBreakdown} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg my-stack-lg">
        <div className="lg:col-span-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm">
          <h2 className="font-headline-md text-headline-md text-text-charcoal mb-stack-md">{t("chart.avgRiskBySector")}</h2>
          {summary && <SectorRiskBars data={summary.sector_breakdown} />}
        </div>

        <div className="lg:col-span-2 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="flex flex-wrap items-center gap-3 p-stack-md border-b border-outline-variant">
            <h2 className="font-headline-md text-headline-md text-text-charcoal mr-auto">
              {t("officer.prioritizedList")}
            </h2>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value as Sector | "")}
              className="font-label-sm text-label-sm rounded-lg border border-outline-variant px-2.5 py-1.5 h-touch-target"
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
              className="font-label-sm text-label-sm rounded-lg border border-outline-variant px-2.5 py-1.5 h-touch-target"
            >
              <option value="">{t("officer.allRiskLevels")}</option>
              <option value="high">{t("risk.high")}</option>
              <option value="medium">{t("risk.medium")}</option>
              <option value="low">{t("risk.low")}</option>
            </select>
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full font-body-md text-body-md">
              <thead>
                <tr className="text-left font-label-caps text-label-caps text-slate-muted">
                  <th className="px-4 py-2 font-bold">{t("officer.colEnterprise")}</th>
                  <th className="px-4 py-2 font-bold">{t("officer.colSector")}</th>
                  <th className="px-4 py-2 font-bold">{t("officer.colRisk")}</th>
                  <th className="px-4 py-2 font-bold">{t("officer.colMainDriver")}</th>
                  <th className="px-4 py-2 font-bold text-right">{t("officer.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-muted">
                      {t("officer.loadingEnterprises")}
                    </td>
                  </tr>
                )}
                {filteredRows?.map((row) => (
                  <tr
                    key={row.enterprise_id}
                    onClick={() => navigate(`/officer/enterprise/${row.enterprise_id}`)}
                    className={`border-t border-outline-variant hover:bg-surface-cream cursor-pointer transition-colors ${
                      row.risk_level === "high" ? "bg-error-container/10" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 font-bold text-on-surface">{row.name}</td>
                    <td className="px-4 py-2.5 text-slate-muted">{t(`sectors.${row.sector}`)}</td>
                    <td className="px-4 py-2.5">
                      <RiskBadge level={row.risk_level} />
                    </td>
                    <td className="px-4 py-2.5 text-slate-muted">{row.top_driver}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Icon name="chevron_right" className="text-primary inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden divide-y divide-outline-variant">
            {isLoading && (
              <div className="px-4 py-6 text-center font-body-md text-body-md text-slate-muted">
                {t("officer.loadingEnterprises")}
              </div>
            )}
            {filteredRows?.map((row) => (
              <div key={row.enterprise_id} className="p-stack-md flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-headline-md text-headline-md text-on-surface">{row.name}</h4>
                    <p className="font-body-md text-body-md text-slate-muted">
                      {t(`sectors.${row.sector}`)} · #{row.enterprise_id}
                    </p>
                  </div>
                  <RiskBadge level={row.risk_level} className="flex-shrink-0" />
                </div>
                <div className="bg-surface-cream p-3 rounded-lg flex items-start gap-2 border border-outline-variant/50">
                  <Icon name="insights" className="text-outline mt-0.5" size={20} />
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface block font-bold">
                      {t("officer.colMainDriver")}
                    </span>
                    <span className="font-body-md text-body-md text-on-surface-variant">{row.top_driver}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/officer/enterprise/${row.enterprise_id}`)}
                  className="w-full h-touch-target bg-primary text-on-primary font-label-sm text-label-sm rounded-lg flex items-center justify-center gap-2 hover:bg-primary-container transition-colors"
                >
                  <Icon name="visibility" size={18} />
                  {t("officer.viewDetails")}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="bg-primary rounded-xl p-stack-lg text-on-primary relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 font-label-caps text-label-caps text-on-primary/70 mb-3">
            <Icon name="cloud" size={16} />
            {t("officer.climateBannerTitle")}
          </div>
          {climateFlags && climateFlags.length > 0 ? (
            <div className="flex flex-col gap-3">
              {climateFlags.map((f) => (
                <div key={`${f.sector}-${f.state}-${f.flag_type}`} className="flex items-start gap-3">
                  <Icon name={f.flag_type === "flood" ? "flood" : "water_drop"} filled size={22} className="flex-shrink-0 mt-0.5" />
                  <p className="font-body-md text-body-md text-on-primary/90">
                    {t(`officer.climateFlag.${f.flag_type}`, {
                      sector: t(`sectors.${f.sector}`),
                      state: f.state,
                      count: f.enterprise_count,
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-body-md text-body-md text-on-primary/80">{t("officer.climateNoFlags")}</p>
          )}
        </div>
      </section>
    </div>
  );
}
