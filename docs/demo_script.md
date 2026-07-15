# Demo Script — GramDrishti AI (NABARD Hackathon)

## 30-second pitch

Rural micro-enterprises don't fail overnight — they show warning signs for
months first: income drifting down, expenses creeping up, digital sales
slowing, a missed loan payment. Today those signs are only spotted after a
field officer's next visit, if at all. We built **GramDrishti AI** — "gram"
(village) + "drishti" (foresight) — a system that reads those signals
continuously, combining an enterprise's own financials with UPI transaction
trends, sector context, and local climate/market conditions, to forecast
cash flow 6 months out, flag risk before it becomes a crisis, explain *why*
in plain language, and recommend a concrete next step. One portal for the
enterprise owner, one dashboard for the field officer, same underlying
intelligence.

## Setup before presenting

1. Backend: `cd backend && venv/Scripts/python.exe -m uvicorn main:app --port 8000`
2. Frontend: `cd frontend && npm run dev` → http://localhost:5173
3. (Data already seeded — re-seed anytime with `python -m app.data_gen.seed`
   then retrain with `python -m app.ml.train` if you want a fresh random draw.)

Demo accounts (password `demo1234` for all):
- Field officer: `officer@nabard.demo`
- Enterprise owner, at-risk case: `owner1@nabard.demo` (Dairy Unit 001, Mysuru)
- Enterprise owner, stable case: `owner2@nabard.demo` (Dairy Unit 002, Gaya)

## Live demo flow (~4 minutes)

**1. Start as the Field Officer** (`officer@nabard.demo`)
- Dashboard opens on the KPI row: 60 enterprises monitored, split by risk
  level, plus an "average risk score by sector" chart — sector-specific
  risk is visible at a glance (food processing and poultry running hotter
  than handicrafts/rural retail in this data pull).
- Point at the prioritized intervention list: sorted high → medium → low
  automatically, so the officer's next visit is obvious without any manual
  triage.
- Click into **Poultry Unit 020 (Belagavi)** — a real flagged case.
  - Risk banner: "shows signs of financial stress... within 1 month.
    Main factor: missed loan repayments" — plain language, not a raw score.
  - Scroll to the loans table: two loans, one delayed, one **defaulted** —
    the model surfaced this from real structured data, not a guess.
  - Cash flow chart: solid actual line, dashed 6-month forecast, shaded
    confidence band — the forecast keeps drifting down, consistent with the
    alert.
  - Recommendations panel: "Talk to your lender early," "Address the loan
    default," "Trim non-essential expenses" — generated from the same SHAP
    drivers driving the alert, not generic advice.

**2. Switch to that same enterprise's owner** (`owner1@nabard.demo`)
- Same underlying data, framed for a non-technical user: no jargon, no
  SHAP values — just the alert, the trend, and what to do about it.
- Add a transaction (income, ₹5,000) and watch the cash balance and forecast
  update immediately — this is a live model re-run, not a cached number.
- Turn off network in devtools, add another entry — it queues locally
  ("saved offline, will sync when back online"); reconnect and it flushes
  automatically. This is the offline-first requirement for low-connectivity
  rural areas.

**3. Compare against the stable case** (`owner2@nabard.demo`)
- Same UI, medium risk, rising cash flow trend, and a "Continue monitoring"
  recommendation — showing the system doesn't cry wolf: it only surfaces
  actionable alerts when there's an actual dominant driver, and says so
  honestly when there isn't one.

## What's under the hood (if asked)

- **Data**: synthetic but structurally realistic — 60 enterprises across
  5 sectors (dairy, poultry, food processing, handicrafts, rural retail),
  24 months of financial + UPI history each, joined against a shared
  sector+state+month climate/market table (rainfall, temperature, commodity
  price index, demand index, flood/drought/festival flags). A subset of
  enterprises is deliberately scripted with a worsening trend so the
  early-warning system has real positive cases — the rest is the model
  finding genuine signal, not overfitting to a hand-tuned demo case.
- **Forecasting**: LightGBM regressor predicting month-over-month cash
  balance delta, applied recursively for a 6-month horizon, with a
  residual-based confidence band.
- **Risk classification**: LightGBM multiclass model trained on
  rule-bootstrapped Low/Medium/High labels (a transparent starting
  definition of "risk"), which then generalizes the pattern across engineered
  features — income trend, expense ratio, cash buffer, UPI trend, loan
  delinquency, sector, and joined climate/market indicators.
- **Explainability**: SHAP TreeExplainer values against the risk model,
  surfaced as the top contributing factors in plain language — the same
  drivers power both the alert message and the recommendation engine, so
  the explanation and the advice are always consistent with each other.
- **Recommendations**: deterministic rule engine keyed off (driver, sector)
  — reliable for a live demo, and sector-aware (e.g. feed-cost guidance for
  dairy/poultry, festival-demand prep for handicrafts).

## Judging-criteria checklist

| Requirement | Where it shows up |
|---|---|
| Multi-source data integration | Financial + UPI + climate/market tables, joined per enterprise-month |
| Cash flow forecasting (3-6mo) | Portal & officer detail cash-flow chart |
| Risk prediction + early warning | Risk gauge, alert banner, horizon estimate |
| Explainable AI | SHAP-derived driver list on every alert |
| Recommendation engine | Sector-aware action cards |
| Sector-specific intelligence | Sector features + sector-tuned recommendation templates |
| Climate & market risk | Rainfall/drought/flood/commodity/demand as model features and drivers |
| Enterprise portal | `/portal` — entry forms, forecast, alerts, recommendations |
| Field officer dashboard | `/officer` — prioritized list, sector analytics, drill-down |
| Offline capability | IndexedDB queue + auto-sync, PWA installable |
