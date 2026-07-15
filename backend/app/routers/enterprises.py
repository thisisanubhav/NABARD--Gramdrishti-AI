from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Enterprise, FinancialRecord, Loan, Role, UpiTransaction, User
from app.schemas import (
    EnterpriseCreate,
    EnterpriseOut,
    FinancialRecordOut,
    LoanOut,
    UpiTransactionOut,
)

router = APIRouter(prefix="/enterprises", tags=["enterprises"])


def _check_access(enterprise_id: int, user: User):
    if user.role == Role.enterprise_owner and user.enterprise_id != enterprise_id:
        raise HTTPException(status_code=403, detail="Not authorized for this enterprise")


@router.get("", response_model=list[EnterpriseOut])
def list_enterprises(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == Role.enterprise_owner:
        return db.query(Enterprise).filter(Enterprise.id == user.enterprise_id).all()
    return db.query(Enterprise).all()


@router.post("", response_model=EnterpriseOut)
def create_enterprise(
    payload: EnterpriseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    enterprise = Enterprise(**payload.model_dump())
    db.add(enterprise)
    db.commit()
    db.refresh(enterprise)
    return enterprise


@router.get("/{enterprise_id}", response_model=EnterpriseOut)
def get_enterprise(
    enterprise_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    _check_access(enterprise_id, user)
    enterprise = db.get(Enterprise, enterprise_id)
    if not enterprise:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    return enterprise


@router.get("/{enterprise_id}/financials", response_model=list[FinancialRecordOut])
def get_financials(
    enterprise_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    _check_access(enterprise_id, user)
    return (
        db.query(FinancialRecord)
        .filter(FinancialRecord.enterprise_id == enterprise_id)
        .order_by(FinancialRecord.month)
        .all()
    )


@router.get("/{enterprise_id}/loans", response_model=list[LoanOut])
def get_loans(
    enterprise_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    _check_access(enterprise_id, user)
    return db.query(Loan).filter(Loan.enterprise_id == enterprise_id).all()


@router.get("/{enterprise_id}/upi", response_model=list[UpiTransactionOut])
def get_upi(
    enterprise_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    _check_access(enterprise_id, user)
    return (
        db.query(UpiTransaction)
        .filter(UpiTransaction.enterprise_id == enterprise_id)
        .order_by(UpiTransaction.month)
        .all()
    )
