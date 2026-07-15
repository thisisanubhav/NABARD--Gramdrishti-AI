import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";
import { CHROME, SECTOR_COLOR } from "../theme";
import type { SectorBreakdown } from "../api/types";

export function SectorBarChart({ data }: { data: SectorBreakdown[] }) {
  const { t } = useTranslation();
  const chartData = data.map((d) => ({
    sector: d.sector,
    label: t(`sectors.${d.sector}`),
    avgRiskPct: Math.round(d.avg_risk_score * 100),
    highRiskCount: d.high_risk_count,
    count: d.count,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={CHROME.gridline} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: CHROME.mutedInk }}
            axisLine={{ stroke: CHROME.baseline }}
            tickLine={false}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: CHROME.mutedInk }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            formatter={(value: any, name: any) =>
              name === "avgRiskPct" ? [`${value}%`, t("chart.avgRiskScore")] : [value, name]
            }
            contentStyle={{ borderRadius: 8, border: `1px solid ${CHROME.gridline}`, fontSize: 12 }}
          />
          <Bar dataKey="avgRiskPct" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {chartData.map((entry) => (
              <Cell key={entry.sector} fill={SECTOR_COLOR[entry.sector] ?? CHROME.mutedInk} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
