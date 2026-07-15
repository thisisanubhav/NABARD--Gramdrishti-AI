"""Cash-flow forecasting: a global LightGBM regressor predicts next-month
cash-balance delta from the engineered feature panel. At inference time the
model is applied recursively (predicted state feeds the next step's lag
features) to produce a multi-month forecast, with a confidence band derived
from the residual distribution observed during training (bootstrap-style,
not a true quantile model — simple and good enough for a demo ribbon)."""

from datetime import date
from pathlib import Path

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

from app.ml.features import FEATURE_COLUMNS, RecursiveState, row_to_feature_vector

MODEL_FILENAME = "forecast_model.pkl"


def train(df: pd.DataFrame) -> tuple[lgb.LGBMRegressor, float, dict]:
    X = df[FEATURE_COLUMNS]
    y = df["delta_next"]

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.15, random_state=42)

    model = lgb.LGBMRegressor(
        n_estimators=300,
        learning_rate=0.05,
        num_leaves=31,
        min_child_samples=10,
        random_state=42,
        verbose=-1,
    )
    model.fit(X_train, y_train)

    val_pred = model.predict(X_val)
    residuals = y_val.values - val_pred
    residual_std = float(np.std(residuals))
    mae = float(np.mean(np.abs(residuals)))

    metrics = {"val_mae": mae, "val_residual_std": residual_std, "n_train": len(X_train), "n_val": len(X_val)}
    return model, residual_std, metrics


def save(model: lgb.LGBMRegressor, residual_std: float, artifacts_dir: Path):
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "residual_std": residual_std}, artifacts_dir / MODEL_FILENAME)


def load(artifacts_dir: Path) -> tuple[lgb.LGBMRegressor, float]:
    payload = joblib.load(artifacts_dir / MODEL_FILENAME)
    return payload["model"], payload["residual_std"]


def _add_months(m: date, n: int) -> date:
    y, mo = m.year, m.month + n
    while mo > 12:
        mo -= 12
        y += 1
    while mo < 1:
        mo += 12
        y -= 1
    return date(y, mo, 1)


def predict_recursive(
    model: lgb.LGBMRegressor,
    residual_std: float,
    state: RecursiveState,
    external_lookup: dict[date, dict],
    start_month: date,
    horizon: int = 6,
) -> list[dict]:
    """Rolls the model forward `horizon` months, feeding each prediction back
    in as the next step's most-recent actuals. external_lookup provides the
    projected climate/market row for each future month (sector+state scoped,
    generated alongside history using the same seasonal model)."""

    results = []
    cur = state.latest()
    for step in range(1, horizon + 1):
        month = _add_months(start_month, step)
        ext_row = external_lookup.get(month, {})
        feature_row = state.build_row(month, ext_row)
        X = row_to_feature_vector(feature_row)
        delta = float(model.predict(X)[0])

        predicted_cash_balance = cur["cash_balance"] + delta
        band = residual_std * (1 + 0.15 * (step - 1))  # widen uncertainty further out

        results.append(
            dict(
                month=month,
                predicted_cash_balance=predicted_cash_balance,
                lower_bound=predicted_cash_balance - band,
                upper_bound=predicted_cash_balance + band,
            )
        )

        next_income = max(0.0, cur["income"] * (1 + feature_row["income_trend_3m"] * 0.3))
        next_expenses = max(0.0, cur["expenses"])
        next_record = dict(
            income=next_income,
            expenses=next_expenses,
            cash_balance=predicted_cash_balance,
            working_capital=predicted_cash_balance,
            savings=cur["savings"],
            upi_txn_volume=cur["upi_txn_volume"],
            avg_txn_value=cur["avg_txn_value"],
        )
        state.advance(next_record)
        cur = next_record

    return results
