from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, EmailStr

from app.models import EnterpriseSize, RepaymentStatus, RiskLevel, Role, Sector


# ---- Auth ----
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: Role
    enterprise_id: int | None = None


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: Role
    enterprise_id: int | None = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ---- Enterprise ----
class EnterpriseOut(BaseModel):
    id: int
    name: str
    sector: Sector
    state: str
    district: str
    years_in_operation: int
    size: EnterpriseSize

    class Config:
        from_attributes = True


class EnterpriseCreate(BaseModel):
    name: str
    sector: Sector
    state: str
    district: str
    years_in_operation: int
    size: EnterpriseSize


# ---- Financial records ----
class FinancialRecordOut(BaseModel):
    month: date
    income: float
    expenses: float
    cash_balance: float
    working_capital: float
    savings: float

    class Config:
        from_attributes = True


class TransactionEntry(BaseModel):
    """A single user-entered transaction that gets folded into the enterprise's
    current-month financial record (upsert-by-month, matching how a micro-enterprise
    owner actually records activity: running income/expense totals, not a full ledger)."""

    type: str  # income | expense | savings
    amount: float
    month: date | None = None


class LoanEntry(BaseModel):
    principal: float
    outstanding: float
    monthly_repayment: float
    repayment_status: RepaymentStatus
    start_month: date


class LoanOut(BaseModel):
    id: int
    principal: float
    outstanding: float
    monthly_repayment: float
    repayment_status: RepaymentStatus
    start_month: date
    missed_payments_last_6m: int

    class Config:
        from_attributes = True


# ---- UPI ----
class UpiTransactionOut(BaseModel):
    month: date
    txn_volume: float
    txn_count: int
    avg_txn_value: float

    class Config:
        from_attributes = True


# ---- Forecast / Risk / Recommendations ----
class ForecastPoint(BaseModel):
    month: date
    predicted_cash_balance: float
    lower_bound: float
    upper_bound: float


class ForecastOut(BaseModel):
    enterprise_id: int
    generated_at: datetime
    history: list[FinancialRecordOut]
    forecast: list[ForecastPoint]


class RiskDriver(BaseModel):
    feature: str
    label: str
    impact: float
    direction: str  # increases_risk | decreases_risk


class RiskOut(BaseModel):
    enterprise_id: int
    level: RiskLevel
    score: float
    horizon_months: int
    message: str
    drivers: list[RiskDriver]
    generated_at: datetime


class Recommendation(BaseModel):
    title: str
    detail: str
    driver: str


class RecommendationsOut(BaseModel):
    enterprise_id: int
    recommendations: list[Recommendation]


# ---- Risk history ----
class RiskHistoryPoint(BaseModel):
    month: date
    level: RiskLevel
    score: float

    class Config:
        from_attributes = True


class RiskHistoryOut(BaseModel):
    enterprise_id: int
    history: list[RiskHistoryPoint]


# ---- Alerts ----
class AlertOut(BaseModel):
    month: date
    level: RiskLevel
    score: float
    horizon_months: int
    message: str
    generated_at: datetime

    class Config:
        from_attributes = True


class OfficerAlertOut(BaseModel):
    enterprise_id: int
    enterprise_name: str
    level: RiskLevel
    score: float
    horizon_months: int
    message: str
    generated_at: datetime


# ---- What-if simulator ----
class SimulateRequest(BaseModel):
    income_change_pct: float = 0.0
    expense_change_pct: float = 0.0


class SimulateOut(BaseModel):
    enterprise_id: int
    income_change_pct: float
    expense_change_pct: float
    forecast: list[ForecastPoint]
    risk_level: RiskLevel
    risk_score: float
    risk_message: str
    drivers: list[RiskDriver]
    recommendations: list[Recommendation]


# ---- Officer views ----
class OfficerEnterpriseRow(BaseModel):
    enterprise_id: int
    name: str
    sector: Sector
    state: str
    district: str
    risk_level: RiskLevel
    risk_score: float
    cash_balance: float
    top_driver: str


class SectorBreakdown(BaseModel):
    sector: Sector
    count: int
    avg_risk_score: float
    high_risk_count: int


class OfficerSummary(BaseModel):
    total_enterprises: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    sector_breakdown: list[SectorBreakdown]


# ---- External indicators ----
class ExternalIndicatorOut(BaseModel):
    month: date
    rainfall_mm: float
    temp_c: float
    commodity_price_index: float
    demand_index: float
    flood_flag: int
    drought_flag: int
    festival_flag: int

    class Config:
        from_attributes = True


class ClimateFlagOut(BaseModel):
    sector: Sector
    state: str
    flag_type: Literal["flood", "drought"]
    enterprise_count: int
    month: date
