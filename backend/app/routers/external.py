from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import ExternalIndicator, Sector, User
from app.schemas import ExternalIndicatorOut

router = APIRouter(prefix="/external", tags=["external"])


@router.get("/indicators", response_model=list[ExternalIndicatorOut])
def get_indicators(
    sector: Sector,
    state: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(ExternalIndicator)
        .filter(ExternalIndicator.sector == sector, ExternalIndicator.state == state)
        .order_by(ExternalIndicator.month)
        .all()
    )
