"""Feature engineering shared by model training (vectorized, pandas) and
recursive inference (per-step, plain Python) for the forecast and risk models.

Both paths compute the same formulas (lag/rolling stats, ratios, seasonal
encoding, joined external indicators) so a model trained on the panel behaves
consistently at inference time.
"""

import math
from datetime import date

import numpy as np
import pandas as pd
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Enterprise, ExternalIndicator, FinancialRecord, Loan, UpiTransaction

SECTORS = ["dairy", "poultry", "food_processing", "handicrafts", "rural_retail"]
SIZES = ["micro", "small", "medium"]

BASE_FEATURE_COLUMNS = [
    "income",
    "expenses",
    "savings",
    "working_capital",
    "cash_balance",
    "income_lag1",
    "income_lag2",
    "income_lag3",
    "expenses_lag1",
    "expenses_lag2",
    "cash_balance_lag1",
    "cash_balance_lag3",
    "income_roll3_mean",
    "income_roll3_std",
    "expenses_roll3_mean",
    "income_trend_3m",
    "expense_income_ratio",
    "savings_ratio",
    "cash_buffer_months",
    "upi_txn_volume",
    "upi_txn_volume_lag1",
    "upi_txn_trend_3m",
    "avg_txn_value",
    "outstanding_loan_total",
    "loan_repayment_burden",
    "missed_payments_last_6m_max",
    "has_defaulted",
    "years_in_operation",
    "rainfall_mm",
    "temp_c",
    "commodity_price_index",
    "demand_index",
    "flood_flag",
    "drought_flag",
    "festival_flag",
    "month_sin",
    "month_cos",
]
CATEGORICAL_COLUMNS = [f"sector_{s}" for s in SECTORS] + [f"size_{s}" for s in SIZES]
FEATURE_COLUMNS = BASE_FEATURE_COLUMNS + CATEGORICAL_COLUMNS

# Human-readable labels for SHAP driver explanations, shown to end users.
FEATURE_LABELS = {
    "income_trend_3m": "Income trend over the last 3 months",
    "expense_income_ratio": "Expenses as a share of income",
    "cash_buffer_months": "Cash buffer (months of expenses covered)",
    "upi_txn_trend_3m": "Digital (UPI) transaction volume trend",
    "missed_payments_last_6m_max": "Missed loan repayments in the last 6 months",
    "has_defaulted": "Loan default on record",
    "savings_ratio": "Savings as a share of income",
    "commodity_price_index": "Commodity / input price index",
    "demand_index": "Local market demand index",
    "rainfall_mm": "Rainfall levels",
    "drought_flag": "Drought conditions",
    "flood_flag": "Flood conditions",
    "loan_repayment_burden": "Loan repayment burden relative to income",
    "income_roll3_std": "Income volatility (3-month)",
    "outstanding_loan_total": "Total outstanding loan amount",
}

EPS = 1e-6


def _month_sin_cos(m: date) -> tuple[float, float]:
    angle = (m.month - 1) / 12 * 2 * math.pi
    return math.sin(angle), math.cos(angle)


def _loan_aggregates(db: Session) -> pd.DataFrame:
    rows = db.query(Loan).all()
    if not rows:
        return pd.DataFrame(
            columns=[
                "enterprise_id",
                "outstanding_loan_total",
                "loan_repayment_burden",
                "missed_payments_last_6m_max",
                "has_defaulted",
            ]
        )
    by_ent: dict[int, dict] = {}
    for loan in rows:
        agg = by_ent.setdefault(
            loan.enterprise_id,
            dict(outstanding_loan_total=0.0, monthly_repayment_total=0.0, missed_max=0, defaulted=0),
        )
        agg["outstanding_loan_total"] += loan.outstanding
        agg["monthly_repayment_total"] += loan.monthly_repayment
        agg["missed_max"] = max(agg["missed_max"], loan.missed_payments_last_6m)
        if loan.repayment_status.value == "defaulted":
            agg["defaulted"] = 1
    out = pd.DataFrame(
        [
            dict(
                enterprise_id=eid,
                outstanding_loan_total=v["outstanding_loan_total"],
                loan_repayment_burden=v["monthly_repayment_total"],
                missed_payments_last_6m_max=v["missed_max"],
                has_defaulted=v["defaulted"],
            )
            for eid, v in by_ent.items()
        ]
    )
    return out


def build_training_panel(db: Session) -> pd.DataFrame:
    """One row per enterprise-month with engineered features plus the
    forecast target (next month's cash balance delta) and a rule-bootstrapped
    risk label, ready for model training."""

    fin_rows = db.query(FinancialRecord).all()
    fin = pd.DataFrame(
        [
            dict(
                enterprise_id=r.enterprise_id,
                month=r.month,
                income=r.income,
                expenses=r.expenses,
                cash_balance=r.cash_balance,
                working_capital=r.working_capital,
                savings=r.savings,
            )
            for r in fin_rows
        ]
    )

    upi_rows = db.query(UpiTransaction).all()
    upi = pd.DataFrame(
        [
            dict(
                enterprise_id=r.enterprise_id,
                month=r.month,
                upi_txn_volume=r.txn_volume,
                avg_txn_value=r.avg_txn_value,
            )
            for r in upi_rows
        ]
    )

    ents = db.query(Enterprise).all()
    ent_df = pd.DataFrame(
        [
            dict(
                enterprise_id=e.id,
                sector=e.sector.value,
                state=e.state,
                size=e.size.value,
                years_in_operation=e.years_in_operation,
            )
            for e in ents
        ]
    )

    ext_rows = db.query(ExternalIndicator).all()
    ext = pd.DataFrame(
        [
            dict(
                sector=r.sector.value,
                state=r.state,
                month=r.month,
                rainfall_mm=r.rainfall_mm,
                temp_c=r.temp_c,
                commodity_price_index=r.commodity_price_index,
                demand_index=r.demand_index,
                flood_flag=r.flood_flag,
                drought_flag=r.drought_flag,
                festival_flag=r.festival_flag,
            )
            for r in ext_rows
        ]
    )

    loans = _loan_aggregates(db)

    df = fin.merge(upi, on=["enterprise_id", "month"], how="left")
    df = df.merge(ent_df, on="enterprise_id", how="left")
    df = df.merge(ext, on=["sector", "state", "month"], how="left")
    df = df.merge(loans, on="enterprise_id", how="left")

    for col in ["outstanding_loan_total", "loan_repayment_burden", "missed_payments_last_6m_max", "has_defaulted"]:
        df[col] = df[col].fillna(0)

    df = df.sort_values(["enterprise_id", "month"]).reset_index(drop=True)
    grp = df.groupby("enterprise_id")

    df["income_lag1"] = grp["income"].shift(1)
    df["income_lag2"] = grp["income"].shift(2)
    df["income_lag3"] = grp["income"].shift(3)
    df["expenses_lag1"] = grp["expenses"].shift(1)
    df["expenses_lag2"] = grp["expenses"].shift(2)
    df["cash_balance_lag1"] = grp["cash_balance"].shift(1)
    df["cash_balance_lag3"] = grp["cash_balance"].shift(3)
    df["upi_txn_volume_lag1"] = grp["upi_txn_volume"].shift(1)

    df["income_roll3_mean"] = grp["income"].transform(lambda s: s.shift(1).rolling(3).mean())
    df["income_roll3_std"] = grp["income"].transform(lambda s: s.shift(1).rolling(3).std())
    df["expenses_roll3_mean"] = grp["expenses"].transform(lambda s: s.shift(1).rolling(3).mean())

    df["income_trend_3m"] = (df["income_lag1"] - df["income_lag3"]) / (df["income_lag3"].abs() + EPS)
    df["upi_txn_trend_3m"] = (df["upi_txn_volume"] - df["upi_txn_volume_lag1"]) / (
        df["upi_txn_volume_lag1"].abs() + EPS
    )
    df["expense_income_ratio"] = df["expenses"] / (df["income"].abs() + EPS)
    df["savings_ratio"] = df["savings"] / (df["income"].abs() + EPS)
    df["cash_buffer_months"] = df["cash_balance"] / (df["expenses_roll3_mean"].abs() + EPS)

    month_angles = df["month"].apply(_month_sin_cos)
    df["month_sin"] = month_angles.apply(lambda t: t[0])
    df["month_cos"] = month_angles.apply(lambda t: t[1])

    for s in SECTORS:
        df[f"sector_{s}"] = (df["sector"] == s).astype(int)
    for s in SIZES:
        df[f"size_{s}"] = (df["size"] == s).astype(int)

    df["cash_balance_next"] = grp["cash_balance"].shift(-1)
    df["delta_next"] = df["cash_balance_next"] - df["cash_balance"]

    df["risk_label"] = df.apply(_bootstrap_risk_label, axis=1)

    df = df.dropna(
        subset=["income_lag3", "expenses_roll3_mean", "delta_next"]
    ).reset_index(drop=True)
    return df


def _bootstrap_risk_label(row: pd.Series) -> str:
    """Rule-based label used to seed the classifier's training targets."""
    buffer = row["cash_buffer_months"]
    income_trend = row["income_trend_3m"]
    expense_ratio = row["expense_income_ratio"]
    missed = row["missed_payments_last_6m_max"]
    defaulted = row["has_defaulted"]

    high = (
        buffer < 2
        or defaulted == 1
        or missed >= 2
        or (income_trend < -0.15 and expense_ratio > 0.9)
    )
    if high:
        return "high"

    medium = buffer < 4 or income_trend < -0.05 or expense_ratio > 0.85 or missed >= 1
    if medium:
        return "medium"

    return "low"


def row_to_feature_vector(row: dict) -> pd.DataFrame:
    values = {col: row.get(col, 0.0) for col in FEATURE_COLUMNS}
    return pd.DataFrame([values], columns=FEATURE_COLUMNS)


class RecursiveState:
    """Holds a rolling window of recent months for one enterprise so a
    forecast/risk feature row can be recomputed at each recursive step using
    the same formulas as the training panel."""

    def __init__(
        self,
        history: list[dict],
        static: dict,
        loan_agg: dict,
    ):
        # history: list of dicts (oldest->newest) with income/expenses/cash_balance/
        # savings/working_capital/upi_txn_volume/avg_txn_value, at least 3 entries.
        self.history = history[-6:]
        self.static = static
        self.loan_agg = loan_agg

    def latest(self) -> dict:
        return self.history[-1]

    def build_row(self, month: date, ext_row: dict) -> dict:
        h = self.history
        cur = h[-1]
        lag1 = h[-2] if len(h) >= 2 else cur
        lag2 = h[-3] if len(h) >= 3 else lag1
        lag3 = h[-4] if len(h) >= 4 else lag2

        roll_window = h[-4:-1] if len(h) >= 4 else h[:-1] or [cur]
        income_roll3_mean = float(np.mean([r["income"] for r in roll_window]))
        income_roll3_std = float(np.std([r["income"] for r in roll_window])) if len(roll_window) > 1 else 0.0
        expenses_roll3_mean = float(np.mean([r["expenses"] for r in roll_window]))

        income_trend_3m = (lag1["income"] - lag3["income"]) / (abs(lag3["income"]) + EPS)
        upi_txn_trend_3m = (cur["upi_txn_volume"] - lag1["upi_txn_volume"]) / (
            abs(lag1["upi_txn_volume"]) + EPS
        )
        expense_income_ratio = cur["expenses"] / (abs(cur["income"]) + EPS)
        savings_ratio = cur["savings"] / (abs(cur["income"]) + EPS)
        cash_buffer_months = cur["cash_balance"] / (abs(expenses_roll3_mean) + EPS)

        sin_v, cos_v = _month_sin_cos(month)

        row = dict(
            income=cur["income"],
            expenses=cur["expenses"],
            savings=cur["savings"],
            working_capital=cur["working_capital"],
            cash_balance=cur["cash_balance"],
            income_lag1=lag1["income"],
            income_lag2=lag2["income"],
            income_lag3=lag3["income"],
            expenses_lag1=lag1["expenses"],
            expenses_lag2=lag2["expenses"],
            cash_balance_lag1=lag1["cash_balance"],
            cash_balance_lag3=lag3["cash_balance"],
            income_roll3_mean=income_roll3_mean,
            income_roll3_std=income_roll3_std,
            expenses_roll3_mean=expenses_roll3_mean,
            income_trend_3m=income_trend_3m,
            expense_income_ratio=expense_income_ratio,
            savings_ratio=savings_ratio,
            cash_buffer_months=cash_buffer_months,
            upi_txn_volume=cur["upi_txn_volume"],
            upi_txn_volume_lag1=lag1["upi_txn_volume"],
            upi_txn_trend_3m=upi_txn_trend_3m,
            avg_txn_value=cur["avg_txn_value"],
            outstanding_loan_total=self.loan_agg.get("outstanding_loan_total", 0.0),
            loan_repayment_burden=self.loan_agg.get("loan_repayment_burden", 0.0),
            missed_payments_last_6m_max=self.loan_agg.get("missed_payments_last_6m_max", 0),
            has_defaulted=self.loan_agg.get("has_defaulted", 0),
            years_in_operation=self.static.get("years_in_operation", 0),
            rainfall_mm=ext_row.get("rainfall_mm", 0.0),
            temp_c=ext_row.get("temp_c", 0.0),
            commodity_price_index=ext_row.get("commodity_price_index", 100.0),
            demand_index=ext_row.get("demand_index", 100.0),
            flood_flag=ext_row.get("flood_flag", 0),
            drought_flag=ext_row.get("drought_flag", 0),
            festival_flag=ext_row.get("festival_flag", 0),
            month_sin=sin_v,
            month_cos=cos_v,
        )
        for s in SECTORS:
            row[f"sector_{s}"] = 1 if self.static.get("sector") == s else 0
        for s in SIZES:
            row[f"size_{s}"] = 1 if self.static.get("size") == s else 0
        return row

    def advance(self, next_record: dict):
        self.history.append(next_record)
        if len(self.history) > 6:
            self.history = self.history[-6:]
