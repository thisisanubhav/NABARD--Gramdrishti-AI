"""One-time backfill: computes and persists a risk snapshot for each of the
last few months per enterprise, using only the data that would have been
available as of that month (reusing the exact same feature/inference logic
as live requests). Without this, the risk history timeline would only have
one point until real months pass.

Run with: venv/Scripts/python.exe -m app.ml.backfill_risk_history
"""

from app.database import SessionLocal
from app.ml import inference, risk_model
from app.ml.features import row_to_feature_vector
from app.models import Enterprise, FinancialRecord

BACKFILL_MONTHS = 6
MIN_MONTHS_FOR_FEATURES = 4  # lag3 + a rolling window need at least this much history


def run():
    db = SessionLocal()
    try:
        model = inference._get_risk_model()
        enterprises = db.query(Enterprise).all()
        written = 0

        for enterprise in enterprises:
            financials = (
                db.query(FinancialRecord)
                .filter(FinancialRecord.enterprise_id == enterprise.id)
                .order_by(FinancialRecord.month)
                .all()
            )
            if len(financials) < MIN_MONTHS_FOR_FEATURES + 1:
                continue

            start = max(MIN_MONTHS_FOR_FEATURES, len(financials) - BACKFILL_MONTHS)
            for cutoff in range(start, len(financials)):
                window = financials[: cutoff + 1]
                state, month, ext_by_month = inference._build_state_from_financials(
                    db, enterprise, window
                )
                ext_row = ext_by_month.get(month, {})
                feature_row = state.build_row(month, ext_row)
                X = row_to_feature_vector(feature_row)
                result = risk_model.predict(model, X)
                result["message"] = inference._build_message(result, enterprise)
                inference._record_risk_snapshot(db, enterprise, month, result)
                written += 1

        print(f"Backfilled {written} risk snapshots across {len(enterprises)} enterprises.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
