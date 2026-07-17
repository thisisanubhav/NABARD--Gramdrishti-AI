"""Loads trained model artifacts once and exposes per-enterprise forecast,
risk, and recommendation predictions built from live DB state."""

import copy
import json
from datetime import date, datetime

from sqlalchemy.orm import Session

from app.config import settings
from app.ml import forecast_model, risk_model
from app.ml.features import RecursiveState, row_to_feature_vector
from app.ml.recommend import build_recommendations
from app.models import Enterprise, ExternalIndicator, FinancialRecord, Loan, RiskAlert, UpiTransaction

_forecast_cache: dict = {}
_risk_cache: dict = {}


def _get_forecast_model():
    if "model" not in _forecast_cache:
        model, residual_std = forecast_model.load(settings.ml_artifacts_dir)
        _forecast_cache["model"] = model
        _forecast_cache["residual_std"] = residual_std
    return _forecast_cache["model"], _forecast_cache["residual_std"]


def _get_risk_model():
    if "model" not in _risk_cache:
        _risk_cache["model"] = risk_model.load(settings.ml_artifacts_dir)
    return _risk_cache["model"]


def _loan_agg_for(db: Session, enterprise_id: int) -> dict:
    loans = db.query(Loan).filter(Loan.enterprise_id == enterprise_id).all()
    return dict(
        outstanding_loan_total=sum(l.outstanding for l in loans),
        loan_repayment_burden=sum(l.monthly_repayment for l in loans),
        missed_payments_last_6m_max=max((l.missed_payments_last_6m for l in loans), default=0),
        has_defaulted=int(any(l.repayment_status.value == "defaulted" for l in loans)),
    )


def _build_state(db: Session, enterprise: Enterprise) -> tuple[RecursiveState, date, dict[date, dict]]:
    financials = (
        db.query(FinancialRecord)
        .filter(FinancialRecord.enterprise_id == enterprise.id)
        .order_by(FinancialRecord.month)
        .all()
    )
    return _build_state_from_financials(db, enterprise, financials)


def _build_state_from_financials(
    db: Session, enterprise: Enterprise, financials: list[FinancialRecord]
) -> tuple[RecursiveState, date, dict[date, dict]]:
    """Split out from _build_state so a backfill script can pass a truncated
    financials window and get back the state/feature row 'as of' that month,
    reusing the exact same feature logic as live inference."""
    if not financials:
        raise ValueError("No financial history for this enterprise")

    upi_by_month = {
        u.month: u
        for u in db.query(UpiTransaction).filter(UpiTransaction.enterprise_id == enterprise.id).all()
    }

    history = []
    for f in financials[-6:]:
        u = upi_by_month.get(f.month)
        history.append(
            dict(
                income=f.income,
                expenses=f.expenses,
                cash_balance=f.cash_balance,
                working_capital=f.working_capital,
                savings=f.savings,
                upi_txn_volume=u.txn_volume if u else 0.0,
                avg_txn_value=u.avg_txn_value if u else 0.0,
            )
        )

    static = dict(
        sector=enterprise.sector.value,
        size=enterprise.size.value,
        years_in_operation=enterprise.years_in_operation,
    )
    loan_agg = _loan_agg_for(db, enterprise.id)
    state = RecursiveState(history=history, static=static, loan_agg=loan_agg)

    ext_rows = (
        db.query(ExternalIndicator)
        .filter(
            ExternalIndicator.sector == enterprise.sector, ExternalIndicator.state == enterprise.state
        )
        .all()
    )
    ext_by_month = {
        r.month: dict(
            rainfall_mm=r.rainfall_mm,
            temp_c=r.temp_c,
            commodity_price_index=r.commodity_price_index,
            demand_index=r.demand_index,
            flood_flag=r.flood_flag,
            drought_flag=r.drought_flag,
            festival_flag=r.festival_flag,
        )
        for r in ext_rows
    }

    last_month = financials[-1].month
    return state, last_month, ext_by_month


def forecast_for_enterprise(db: Session, enterprise: Enterprise, horizon: int = 6) -> dict:
    model, residual_std = _get_forecast_model()
    state, last_month, ext_by_month = _build_state(db, enterprise)
    points = forecast_model.predict_recursive(
        model, residual_std, state, ext_by_month, last_month, horizon
    )
    return dict(forecast=points, last_month=last_month)


def risk_for_enterprise(db: Session, enterprise: Enterprise) -> dict:
    model = _get_risk_model()
    state, last_month, ext_by_month = _build_state(db, enterprise)
    ext_row = ext_by_month.get(last_month, {})
    feature_row = state.build_row(last_month, ext_row)
    X = row_to_feature_vector(feature_row)
    result = risk_model.predict(model, X)
    result["message"] = _build_message(result, enterprise)
    _record_risk_snapshot(db, enterprise, last_month, result)
    return result


def _record_risk_snapshot(db: Session, enterprise: Enterprise, month: date, result: dict) -> None:
    """Upserts one risk_alerts row per (enterprise, month) so the risk history
    timeline reflects the latest computed state for that month rather than
    accumulating a row per view."""
    existing = (
        db.query(RiskAlert)
        .filter(RiskAlert.enterprise_id == enterprise.id, RiskAlert.month == month)
        .first()
    )
    if existing:
        existing.level = result["level"]
        existing.score = result["score"]
        existing.drivers = json.dumps(result["drivers"])
        existing.horizon_months = result["horizon_months"]
        existing.message = result["message"]
        existing.generated_at = datetime.utcnow()
    else:
        db.add(
            RiskAlert(
                enterprise_id=enterprise.id,
                month=month,
                level=result["level"],
                score=result["score"],
                drivers=json.dumps(result["drivers"]),
                horizon_months=result["horizon_months"],
                message=result["message"],
            )
        )
    db.commit()


def risk_history_for_enterprise(db: Session, enterprise_id: int) -> list[RiskAlert]:
    return (
        db.query(RiskAlert)
        .filter(RiskAlert.enterprise_id == enterprise_id)
        .order_by(RiskAlert.month)
        .all()
    )


def _build_message(result: dict, enterprise: Enterprise) -> str:
    level = result["level"]
    top_driver_label = risk_model.top_risk_driver_label(result["drivers"])
    if level == "high":
        base = (
            f"{enterprise.name} shows signs of financial stress that may worsen within "
            f"{result['horizon_months']} month(s)."
        )
    elif level == "medium":
        base = (
            f"{enterprise.name} shows early signs of financial strain over the next "
            f"{result['horizon_months']} months."
        )
    else:
        base = f"{enterprise.name}'s financial position currently looks stable."
    if top_driver_label and level != "low":
        base += f" Main factor: {top_driver_label.lower()}."
    return base


def recommendations_for_enterprise(db: Session, enterprise: Enterprise) -> list[dict]:
    risk = risk_for_enterprise(db, enterprise)
    return build_recommendations(enterprise.sector.value, risk["drivers"], risk["level"])


def simulate_for_enterprise(
    db: Session,
    enterprise: Enterprise,
    income_change_pct: float,
    expense_change_pct: float,
    horizon: int = 6,
) -> dict:
    """'What if' scenario: shifts the enterprise's most recent month's income/
    expenses by the given percentages (today's cash balance itself is left
    untouched — that's a fact, not a hypothetical) and re-runs the same
    forecast and risk models from that adjusted starting point. Prior months
    are left as-is, so trend/volatility features still reflect real history.
    Not persisted — this is exploratory, not a recorded snapshot."""

    forecast_model_obj, residual_std = _get_forecast_model()
    risk_model_obj = _get_risk_model()
    state, last_month, ext_by_month = _build_state(db, enterprise)

    latest = state.history[-1]
    adjusted = copy.deepcopy(latest)
    adjusted["income"] = max(0.0, latest["income"] * (1 + income_change_pct / 100))
    adjusted["expenses"] = max(0.0, latest["expenses"] * (1 + expense_change_pct / 100))
    state.history[-1] = adjusted

    ext_row = ext_by_month.get(last_month, {})
    feature_row = state.build_row(last_month, ext_row)
    X = row_to_feature_vector(feature_row)
    risk_result = risk_model.predict(risk_model_obj, X)
    risk_result["message"] = _build_message(risk_result, enterprise)

    points = forecast_model.predict_recursive(
        forecast_model_obj, residual_std, state, ext_by_month, last_month, horizon
    )
    recommendations = build_recommendations(
        enterprise.sector.value, risk_result["drivers"], risk_result["level"]
    )

    return dict(forecast=points, risk=risk_result, recommendations=recommendations)
