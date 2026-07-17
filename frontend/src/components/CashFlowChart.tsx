import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { CATEGORICAL, CHROME, SEQUENTIAL_BLUE } from "../theme";
import type { FinancialRecordOut, ForecastPoint } from "../api/types";

const SCENARIO_COLOR = CATEGORICAL[7]; // orange — visually distinct from the blue actual/forecast lines

function formatMonth(m: string) {
  const d = new Date(m);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

function formatCurrency(v: number) {
  if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (Math.abs(v) >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v.toFixed(0)}`;
}

interface Point {
  month: string;
  label: string;
  actual?: number;
  forecast?: number;
  scenario?: number;
  lower?: number;
  band?: number;
}

function ChartTooltip({ active, payload, label }: any) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const point: Point = payload[0]?.payload ?? {};
  const isForecast = point.forecast !== undefined && point.actual === undefined;

  return (
    <div
      className="rounded-lg bg-white px-3 py-2 text-xs shadow-sm"
      style={{ border: `1px solid ${CHROME.gridline}` }}
    >
      <p className="font-medium text-slate-700 mb-1">{label}</p>
      {point.actual !== undefined && (
        <p className="text-slate-600">
          {t("chart.actual")}: {formatCurrency(point.actual)}
        </p>
      )}
      {isForecast && point.forecast !== undefined && (
        <>
          <p className="text-slate-600">
            {t("chart.forecast")}: {formatCurrency(point.forecast)}
          </p>
          {point.lower !== undefined && point.band !== undefined && (
            <p className="text-slate-400">
              {t("chart.range")}: {formatCurrency(point.lower)} –{" "}
              {formatCurrency(point.lower + point.band)}
            </p>
          )}
        </>
      )}
      {point.scenario !== undefined && (
        <p style={{ color: SCENARIO_COLOR }}>
          {t("chart.scenario")}: {formatCurrency(point.scenario)}
        </p>
      )}
    </div>
  );
}

export function CashFlowChart({
  history,
  forecast,
  scenario,
}: {
  history: FinancialRecordOut[];
  forecast: ForecastPoint[];
  /** Optional what-if forecast, same months as `forecast`, overlaid as a third line. */
  scenario?: ForecastPoint[];
}) {
  const { t } = useTranslation();
  const historyPoints: Point[] = history.map((h) => ({
    month: h.month,
    label: formatMonth(h.month),
    actual: h.cash_balance,
  }));

  const lastActual = history.length > 0 ? history[history.length - 1].cash_balance : undefined;
  const bridge: Point[] =
    history.length > 0
      ? [
          {
            month: history[history.length - 1].month,
            label: formatMonth(history[history.length - 1].month),
            forecast: lastActual,
            scenario: scenario && scenario.length > 0 ? lastActual : undefined,
            lower: lastActual,
            band: 0,
          },
        ]
      : [];

  const scenarioByMonth = new Map((scenario ?? []).map((s) => [s.month, s.predicted_cash_balance]));

  const forecastPoints: Point[] = forecast.map((f) => ({
    month: f.month,
    label: formatMonth(f.month),
    forecast: f.predicted_cash_balance,
    scenario: scenarioByMonth.get(f.month),
    lower: f.lower_bound,
    band: f.upper_bound - f.lower_bound,
  }));

  const data = [...historyPoints.slice(-9), ...bridge, ...forecastPoints];

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={CHROME.gridline} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: CHROME.mutedInk }}
            axisLine={{ stroke: CHROME.baseline }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 11, fill: CHROME.mutedInk }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            dataKey="lower"
            stackId="band"
            stroke="none"
            fill="transparent"
            isAnimationActive={false}
          />
          <Area
            dataKey="band"
            stackId="band"
            stroke="none"
            fill={SEQUENTIAL_BLUE[100]}
            fillOpacity={0.6}
            isAnimationActive={false}
            name="Confidence range"
          />
          <Line
            dataKey="actual"
            stroke={SEQUENTIAL_BLUE[700]}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name="actual"
          />
          <Line
            dataKey="forecast"
            stroke={SEQUENTIAL_BLUE[500]}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            isAnimationActive={false}
            name="forecast"
          />
          {scenario && scenario.length > 0 && (
            <Line
              dataKey="scenario"
              stroke={SCENARIO_COLOR}
              strokeWidth={2}
              strokeDasharray="2 3"
              dot={false}
              isAnimationActive={false}
              name="scenario"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded" style={{ backgroundColor: SEQUENTIAL_BLUE[700] }} />
          {t("chart.actual")}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-0.5 rounded border-t-2 border-dashed"
            style={{ borderColor: SEQUENTIAL_BLUE[500] }}
          />
          {t("chart.forecast6m")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded" style={{ backgroundColor: SEQUENTIAL_BLUE[100] }} />
          {t("chart.confidenceRange")}
        </span>
        {scenario && scenario.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 rounded border-t-2 border-dashed"
              style={{ borderColor: SCENARIO_COLOR }}
            />
            {t("chart.scenario")}
          </span>
        )}
      </div>
    </div>
  );
}
