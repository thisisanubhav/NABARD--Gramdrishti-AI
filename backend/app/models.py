import enum
from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Role(str, enum.Enum):
    enterprise_owner = "enterprise_owner"
    field_officer = "field_officer"


class Sector(str, enum.Enum):
    dairy = "dairy"
    poultry = "poultry"
    food_processing = "food_processing"
    handicrafts = "handicrafts"
    rural_retail = "rural_retail"


class EnterpriseSize(str, enum.Enum):
    micro = "micro"
    small = "small"
    medium = "medium"


class RepaymentStatus(str, enum.Enum):
    on_time = "on_time"
    delayed = "delayed"
    defaulted = "defaulted"


class RiskLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class TxnType(str, enum.Enum):
    income = "income"
    expense = "expense"
    savings = "savings"
    loan_repayment = "loan_repayment"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role))
    enterprise_id: Mapped[int | None] = mapped_column(
        ForeignKey("enterprises.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    enterprise: Mapped["Enterprise | None"] = relationship(back_populates="users")


class Enterprise(Base):
    __tablename__ = "enterprises"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    sector: Mapped[Sector] = mapped_column(Enum(Sector), index=True)
    state: Mapped[str] = mapped_column(String(100), index=True)
    district: Mapped[str] = mapped_column(String(100))
    years_in_operation: Mapped[int] = mapped_column(Integer)
    size: Mapped[EnterpriseSize] = mapped_column(Enum(EnterpriseSize))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    users: Mapped[list["User"]] = relationship(back_populates="enterprise")
    financial_records: Mapped[list["FinancialRecord"]] = relationship(
        back_populates="enterprise", cascade="all, delete-orphan"
    )
    loans: Mapped[list["Loan"]] = relationship(
        back_populates="enterprise", cascade="all, delete-orphan"
    )
    upi_transactions: Mapped[list["UpiTransaction"]] = relationship(
        back_populates="enterprise", cascade="all, delete-orphan"
    )
    risk_alerts: Mapped[list["RiskAlert"]] = relationship(
        back_populates="enterprise", cascade="all, delete-orphan"
    )


class FinancialRecord(Base):
    __tablename__ = "financial_records"
    __table_args__ = (UniqueConstraint("enterprise_id", "month", name="uq_financial_month"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    enterprise_id: Mapped[int] = mapped_column(ForeignKey("enterprises.id"), index=True)
    month: Mapped[date] = mapped_column(Date, index=True)
    income: Mapped[float] = mapped_column(Float)
    expenses: Mapped[float] = mapped_column(Float)
    cash_balance: Mapped[float] = mapped_column(Float)
    working_capital: Mapped[float] = mapped_column(Float)
    savings: Mapped[float] = mapped_column(Float, default=0.0)

    enterprise: Mapped["Enterprise"] = relationship(back_populates="financial_records")


class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    enterprise_id: Mapped[int] = mapped_column(ForeignKey("enterprises.id"), index=True)
    principal: Mapped[float] = mapped_column(Float)
    outstanding: Mapped[float] = mapped_column(Float)
    monthly_repayment: Mapped[float] = mapped_column(Float)
    repayment_status: Mapped[RepaymentStatus] = mapped_column(Enum(RepaymentStatus))
    start_month: Mapped[date] = mapped_column(Date)
    missed_payments_last_6m: Mapped[int] = mapped_column(Integer, default=0)

    enterprise: Mapped["Enterprise"] = relationship(back_populates="loans")


class UpiTransaction(Base):
    __tablename__ = "upi_transactions"
    __table_args__ = (UniqueConstraint("enterprise_id", "month", name="uq_upi_month"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    enterprise_id: Mapped[int] = mapped_column(ForeignKey("enterprises.id"), index=True)
    month: Mapped[date] = mapped_column(Date, index=True)
    txn_volume: Mapped[float] = mapped_column(Float)
    txn_count: Mapped[int] = mapped_column(Integer)
    avg_txn_value: Mapped[float] = mapped_column(Float)

    enterprise: Mapped["Enterprise"] = relationship(back_populates="upi_transactions")


class ExternalIndicator(Base):
    __tablename__ = "external_indicators"
    __table_args__ = (
        UniqueConstraint("sector", "state", "month", name="uq_external_sector_state_month"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sector: Mapped[Sector] = mapped_column(Enum(Sector), index=True)
    state: Mapped[str] = mapped_column(String(100), index=True)
    month: Mapped[date] = mapped_column(Date, index=True)
    rainfall_mm: Mapped[float] = mapped_column(Float)
    temp_c: Mapped[float] = mapped_column(Float)
    commodity_price_index: Mapped[float] = mapped_column(Float)
    demand_index: Mapped[float] = mapped_column(Float)
    flood_flag: Mapped[int] = mapped_column(Integer, default=0)
    drought_flag: Mapped[int] = mapped_column(Integer, default=0)
    festival_flag: Mapped[int] = mapped_column(Integer, default=0)


class RiskAlert(Base):
    __tablename__ = "risk_alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    enterprise_id: Mapped[int] = mapped_column(ForeignKey("enterprises.id"), index=True)
    month: Mapped[date] = mapped_column(Date, index=True)
    level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel))
    score: Mapped[float] = mapped_column(Float)
    drivers: Mapped[str] = mapped_column(Text)
    horizon_months: Mapped[int] = mapped_column(Integer)
    message: Mapped[str] = mapped_column(Text)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    enterprise: Mapped["Enterprise"] = relationship(back_populates="risk_alerts")
