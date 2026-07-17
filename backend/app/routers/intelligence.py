from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.ml import inference
from app.models import Enterprise, FinancialRecord, Role, User
from app.schemas import (
    AlertOut,
    FinancialRecordOut,
    ForecastOut,
    ForecastPoint,
    Recommendation,
    RecommendationsOut,
    RiskDriver,
    RiskHistoryOut,
    RiskHistoryPoint,
    RiskOut,
    SimulateOut,
    SimulateRequest,
)

router = APIRouter(prefix="/enterprises", tags=["intelligence"])


def _check_access(enterprise_id: int, user: User):
    if user.role == Role.enterprise_owner and user.enterprise_id != enterprise_id:
        raise HTTPException(status_code=403, detail="Not authorized for this enterprise")


def _get_enterprise(db: Session, enterprise_id: int) -> Enterprise:
    enterprise = db.get(Enterprise, enterprise_id)
    if not enterprise:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    return enterprise


@router.get("/{enterprise_id}/forecast", response_model=ForecastOut)
def get_forecast(
    enterprise_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    _check_access(enterprise_id, user)
    enterprise = _get_enterprise(db, enterprise_id)
    result = inference.forecast_for_enterprise(db, enterprise)

    history = (
        db.query(FinancialRecord)
        .filter(FinancialRecord.enterprise_id == enterprise_id)
        .order_by(FinancialRecord.month)
        .all()
    )

    return ForecastOut(
        enterprise_id=enterprise_id,
        generated_at=datetime.utcnow(),
        history=[FinancialRecordOut.model_validate(h) for h in history],
        forecast=[ForecastPoint(**p) for p in result["forecast"]],
    )


@router.get("/{enterprise_id}/risk", response_model=RiskOut)
def get_risk(
    enterprise_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    _check_access(enterprise_id, user)
    enterprise = _get_enterprise(db, enterprise_id)
    result = inference.risk_for_enterprise(db, enterprise)

    return RiskOut(
        enterprise_id=enterprise_id,
        level=result["level"],
        score=result["score"],
        horizon_months=result["horizon_months"],
        message=result["message"],
        drivers=[RiskDriver(**d) for d in result["drivers"]],
        generated_at=datetime.utcnow(),
    )


@router.get("/{enterprise_id}/recommendations", response_model=RecommendationsOut)
def get_recommendations(
    enterprise_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    _check_access(enterprise_id, user)
    enterprise = _get_enterprise(db, enterprise_id)
    recs = inference.recommendations_for_enterprise(db, enterprise)
    return RecommendationsOut(
        enterprise_id=enterprise_id, recommendations=[Recommendation(**r) for r in recs]
    )


@router.get("/{enterprise_id}/risk-history", response_model=RiskHistoryOut)
def get_risk_history(
    enterprise_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    _check_access(enterprise_id, user)
    _get_enterprise(db, enterprise_id)
    rows = inference.risk_history_for_enterprise(db, enterprise_id)
    return RiskHistoryOut(
        enterprise_id=enterprise_id,
        history=[RiskHistoryPoint.model_validate(r) for r in rows],
    )


@router.get("/{enterprise_id}/alerts", response_model=list[AlertOut])
def get_alerts(
    enterprise_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    _check_access(enterprise_id, user)
    _get_enterprise(db, enterprise_id)
    rows = inference.risk_history_for_enterprise(db, enterprise_id)
    return [AlertOut.model_validate(r) for r in reversed(rows)]


@router.post("/{enterprise_id}/simulate", response_model=SimulateOut)
def simulate(
    enterprise_id: int,
    payload: SimulateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _check_access(enterprise_id, user)
    enterprise = _get_enterprise(db, enterprise_id)
    result = inference.simulate_for_enterprise(
        db, enterprise, payload.income_change_pct, payload.expense_change_pct
    )
    risk = result["risk"]
    return SimulateOut(
        enterprise_id=enterprise_id,
        income_change_pct=payload.income_change_pct,
        expense_change_pct=payload.expense_change_pct,
        forecast=[ForecastPoint(**p) for p in result["forecast"]],
        risk_level=risk["level"],
        risk_score=risk["score"],
        risk_message=risk["message"],
        drivers=[RiskDriver(**d) for d in risk["drivers"]],
        recommendations=[Recommendation(**r) for r in result["recommendations"]],
    )
