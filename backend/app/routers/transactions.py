from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import FinancialRecord, Loan, Role, User
from app.schemas import FinancialRecordOut, LoanEntry, LoanOut, TransactionEntry

router = APIRouter(prefix="/enterprises", tags=["transactions"])


def _check_access(enterprise_id: int, user: User):
    if user.role == Role.enterprise_owner and user.enterprise_id != enterprise_id:
        raise HTTPException(status_code=403, detail="Not authorized for this enterprise")


def _month_start(d: date) -> date:
    return d.replace(day=1)


@router.post("/{enterprise_id}/transactions", response_model=FinancialRecordOut)
def add_transaction(
    enterprise_id: int,
    payload: TransactionEntry,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _check_access(enterprise_id, user)
    if payload.type not in ("income", "expense", "savings"):
        raise HTTPException(status_code=400, detail="type must be income, expense, or savings")

    month = _month_start(payload.month or date.today())
    record = (
        db.query(FinancialRecord)
        .filter(FinancialRecord.enterprise_id == enterprise_id, FinancialRecord.month == month)
        .first()
    )
    if record is None:
        prior = (
            db.query(FinancialRecord)
            .filter(FinancialRecord.enterprise_id == enterprise_id, FinancialRecord.month < month)
            .order_by(FinancialRecord.month.desc())
            .first()
        )
        carry_balance = prior.cash_balance if prior else 0.0
        record = FinancialRecord(
            enterprise_id=enterprise_id,
            month=month,
            income=0.0,
            expenses=0.0,
            savings=0.0,
            cash_balance=carry_balance,
            working_capital=carry_balance,
        )
        db.add(record)

    if payload.type == "income":
        record.income += payload.amount
        record.cash_balance += payload.amount
    elif payload.type == "expense":
        record.expenses += payload.amount
        record.cash_balance -= payload.amount
    elif payload.type == "savings":
        record.savings += payload.amount
        record.cash_balance -= payload.amount

    record.working_capital = record.cash_balance
    db.commit()
    db.refresh(record)
    return record


@router.post("/{enterprise_id}/loans", response_model=LoanOut)
def add_loan(
    enterprise_id: int,
    payload: LoanEntry,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _check_access(enterprise_id, user)
    loan = Loan(enterprise_id=enterprise_id, **payload.model_dump())
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan
