from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import require_role
from app.database import get_db
from app.ml import inference
from app.ml.risk_model import top_risk_driver_label
from app.models import Enterprise, ExternalIndicator, FinancialRecord, Role, Sector
from app.schemas import (
    ClimateFlagOut,
    OfficerAlertOut,
    OfficerEnterpriseRow,
    OfficerSummary,
    SectorBreakdown,
)

router = APIRouter(prefix="/officer", tags=["officer"], dependencies=[Depends(require_role(Role.field_officer))])

RISK_ORDER = {"high": 0, "medium": 1, "low": 2}


def _latest_cash_balance(db: Session, enterprise_id: int) -> float:
    rec = (
        db.query(FinancialRecord)
        .filter(FinancialRecord.enterprise_id == enterprise_id)
        .order_by(FinancialRecord.month.desc())
        .first()
    )
    return rec.cash_balance if rec else 0.0


def _risk_rows(db: Session, enterprises: list[Enterprise]) -> list[dict]:
    rows = []
    for ent in enterprises:
        risk = inference.risk_for_enterprise(db, ent)
        rows.append(
            dict(
                enterprise=ent,
                level=risk["level"],
                score=risk["score"],
                message=risk["message"],
                horizon_months=risk["horizon_months"],
                top_driver=top_risk_driver_label(risk["drivers"]) or "No dominant factor",
            )
        )
    return rows


@router.get("/enterprises", response_model=list[OfficerEnterpriseRow])
def list_enterprises(
    sector: Sector | None = None,
    risk: str | None = Query(None, pattern="^(low|medium|high)$"),
    state: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Enterprise)
    if sector:
        query = query.filter(Enterprise.sector == sector)
    if state:
        query = query.filter(Enterprise.state == state)
    enterprises = query.all()

    rows = _risk_rows(db, enterprises)
    if risk:
        rows = [r for r in rows if r["level"] == risk]

    rows.sort(key=lambda r: (RISK_ORDER[r["level"]], -r["score"]))

    return [
        OfficerEnterpriseRow(
            enterprise_id=r["enterprise"].id,
            name=r["enterprise"].name,
            sector=r["enterprise"].sector,
            state=r["enterprise"].state,
            district=r["enterprise"].district,
            risk_level=r["level"],
            risk_score=r["score"],
            cash_balance=_latest_cash_balance(db, r["enterprise"].id),
            top_driver=r["top_driver"],
        )
        for r in rows
    ]


@router.get("/summary", response_model=OfficerSummary)
def summary(db: Session = Depends(get_db)):
    enterprises = db.query(Enterprise).all()
    rows = _risk_rows(db, enterprises)

    high = sum(1 for r in rows if r["level"] == "high")
    medium = sum(1 for r in rows if r["level"] == "medium")
    low = sum(1 for r in rows if r["level"] == "low")

    sector_breakdown = []
    for sector in Sector:
        sector_rows = [r for r in rows if r["enterprise"].sector == sector]
        if not sector_rows:
            continue
        avg_score = sum(r["score"] for r in sector_rows) / len(sector_rows)
        high_count = sum(1 for r in sector_rows if r["level"] == "high")
        sector_breakdown.append(
            SectorBreakdown(
                sector=sector,
                count=len(sector_rows),
                avg_risk_score=avg_score,
                high_risk_count=high_count,
            )
        )

    return OfficerSummary(
        total_enterprises=len(enterprises),
        high_risk_count=high,
        medium_risk_count=medium,
        low_risk_count=low,
        sector_breakdown=sector_breakdown,
    )


@router.get("/climate-flags", response_model=list[ClimateFlagOut])
def climate_flags(db: Session = Depends(get_db)):
    enterprises = db.query(Enterprise).all()

    group_counts: dict[tuple[Sector, str], int] = {}
    for ent in enterprises:
        key = (ent.sector, ent.state)
        group_counts[key] = group_counts.get(key, 0) + 1

    results: list[ClimateFlagOut] = []
    for (sector, state), count in group_counts.items():
        latest = (
            db.query(ExternalIndicator)
            .filter(ExternalIndicator.sector == sector, ExternalIndicator.state == state)
            .order_by(ExternalIndicator.month.desc())
            .first()
        )
        if not latest:
            continue
        if latest.flood_flag:
            results.append(
                ClimateFlagOut(sector=sector, state=state, flag_type="flood", enterprise_count=count, month=latest.month)
            )
        if latest.drought_flag:
            results.append(
                ClimateFlagOut(sector=sector, state=state, flag_type="drought", enterprise_count=count, month=latest.month)
            )

    results.sort(key=lambda r: -r.enterprise_count)
    return results


@router.get("/alerts", response_model=list[OfficerAlertOut])
def officer_alerts(db: Session = Depends(get_db)):
    enterprises = db.query(Enterprise).all()
    rows = _risk_rows(db, enterprises)
    alert_rows = [r for r in rows if r["level"] in ("medium", "high")]
    alert_rows.sort(key=lambda r: (RISK_ORDER[r["level"]], -r["score"]))

    now = datetime.utcnow()
    return [
        OfficerAlertOut(
            enterprise_id=r["enterprise"].id,
            enterprise_name=r["enterprise"].name,
            level=r["level"],
            score=r["score"],
            horizon_months=r["horizon_months"],
            message=r["message"],
            generated_at=now,
        )
        for r in alert_rows
    ]
