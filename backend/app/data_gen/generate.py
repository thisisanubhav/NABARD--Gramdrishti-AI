"""Synthetic multi-source data generator for the NABARD prototype.

Produces enterprises, monthly financial records, UPI transaction summaries,
loans, and a shared sector+state+month external-indicator table (rainfall,
temperature, commodity prices, demand, flood/drought/festival flags). A subset
of enterprises is scripted with a worsening trend in the most recent months so
the risk model and alert system have clear positive cases to demo.
"""

import math
from dataclasses import dataclass, field
from datetime import date

import numpy as np

STATES = ["Maharashtra", "Uttar Pradesh", "Karnataka", "Bihar", "Rajasthan"]
DISTRICTS = {
    "Maharashtra": ["Nashik", "Pune", "Kolhapur"],
    "Uttar Pradesh": ["Meerut", "Varanasi", "Gorakhpur"],
    "Karnataka": ["Belagavi", "Mysuru", "Hassan"],
    "Bihar": ["Muzaffarpur", "Bhagalpur", "Gaya"],
    "Rajasthan": ["Ajmer", "Udaipur", "Jodhpur"],
}
SECTORS = ["dairy", "poultry", "food_processing", "handicrafts", "rural_retail"]
ENTERPRISES_PER_SECTOR = 12
MONTHS_OF_HISTORY = 24
FORECAST_HORIZON_MONTHS = 6

SECTOR_PROFILE = {
    "dairy": dict(base_income=(40000, 90000), expense_ratio=(0.60, 0.75), digital_share=(0.35, 0.55)),
    "poultry": dict(base_income=(35000, 80000), expense_ratio=(0.65, 0.82), digital_share=(0.30, 0.50)),
    "food_processing": dict(
        base_income=(50000, 120000), expense_ratio=(0.62, 0.80), digital_share=(0.40, 0.60)
    ),
    "handicrafts": dict(
        base_income=(20000, 70000), expense_ratio=(0.55, 0.75), digital_share=(0.45, 0.70)
    ),
    "rural_retail": dict(
        base_income=(30000, 90000), expense_ratio=(0.68, 0.85), digital_share=(0.50, 0.75)
    ),
}

FESTIVAL_MONTHS = {10, 11, 3}  # Oct/Nov (Diwali season), March (Holi/harvest)
MONSOON_MONTHS = {6, 7, 8, 9}


def month_seq(end_month: date, n: int) -> list[date]:
    months = []
    y, m = end_month.year, end_month.month
    for i in range(n - 1, -1, -1):
        mm = m - i
        yy = y
        while mm <= 0:
            mm += 12
            yy -= 1
        months.append(date(yy, mm, 1))
    return months


@dataclass
class EnterpriseSpec:
    id: int
    name: str
    sector: str
    state: str
    district: str
    years_in_operation: int
    size: str
    base_income: float
    expense_ratio: float
    digital_share: float
    worsening: bool = False


def _rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def full_indicator_month_range(end_month: date) -> list[date]:
    """Historical months plus FORECAST_HORIZON_MONTHS ahead, so forecast lookups
    have projected (seasonal-pattern) climate/market indicators to read."""
    history = month_seq(end_month, MONTHS_OF_HISTORY)
    y, m = end_month.year, end_month.month
    future = []
    for i in range(1, FORECAST_HORIZON_MONTHS + 1):
        mm = m + i
        yy = y
        while mm > 12:
            mm -= 12
            yy += 1
        future.append(date(yy, mm, 1))
    return history + future


def generate_external_indicators(end_month: date, seed: int = 42) -> list[dict]:
    rng = _rng(seed)
    months = full_indicator_month_range(end_month)
    rows = []
    for sector in SECTORS:
        for state in STATES:
            commodity_walk = 100.0
            demand_walk = 100.0
            for m in months:
                seasonal_rain = 250 if m.month in MONSOON_MONTHS else 20
                rainfall = max(0.0, rng.normal(seasonal_rain, seasonal_rain * 0.3 + 5))
                temp = 22 + 10 * math.sin((m.month - 3) / 12 * 2 * math.pi) + rng.normal(0, 1.5)

                commodity_walk *= 1 + rng.normal(0, 0.02)
                demand_walk = 100 + 15 * math.sin((m.month - 1) / 12 * 2 * math.pi)
                festival_flag = int(m.month in FESTIVAL_MONTHS)
                if festival_flag and sector in ("handicrafts", "rural_retail"):
                    demand_walk *= rng.uniform(1.15, 1.4)
                demand_walk *= rng.uniform(0.95, 1.05)

                flood_flag = int(rainfall > seasonal_rain * 1.8 and rng.random() < 0.15)
                drought_flag = int(
                    m.month in MONSOON_MONTHS and rainfall < seasonal_rain * 0.4 and rng.random() < 0.1
                )

                rows.append(
                    dict(
                        sector=sector,
                        state=state,
                        month=m,
                        rainfall_mm=round(rainfall, 1),
                        temp_c=round(temp, 1),
                        commodity_price_index=round(commodity_walk, 2),
                        demand_index=round(demand_walk, 2),
                        flood_flag=flood_flag,
                        drought_flag=drought_flag,
                        festival_flag=festival_flag,
                    )
                )
    return rows


def generate_enterprises(seed: int = 42) -> list[EnterpriseSpec]:
    rng = _rng(seed)
    specs = []
    eid = 1
    worsening_ids = set()
    for sector in SECTORS:
        profile = SECTOR_PROFILE[sector]
        worsening_count = 2
        worsening_slots = set(
            rng.choice(range(ENTERPRISES_PER_SECTOR), size=worsening_count, replace=False)
        )
        for i in range(ENTERPRISES_PER_SECTOR):
            state = STATES[rng.integers(0, len(STATES))]
            district = DISTRICTS[state][rng.integers(0, len(DISTRICTS[state]))]
            base_income = rng.uniform(*profile["base_income"])
            expense_ratio = rng.uniform(*profile["expense_ratio"])
            digital_share = rng.uniform(*profile["digital_share"])
            years = int(rng.integers(1, 20))
            size = rng.choice(["micro", "small", "medium"], p=[0.55, 0.35, 0.10])
            is_worsening = i in worsening_slots
            specs.append(
                EnterpriseSpec(
                    id=eid,
                    name=f"{sector.replace('_', ' ').title()} Unit {eid:03d} ({district})",
                    sector=sector,
                    state=state,
                    district=district,
                    years_in_operation=years,
                    size=size,
                    base_income=base_income,
                    expense_ratio=expense_ratio,
                    digital_share=digital_share,
                    worsening=is_worsening,
                )
            )
            if is_worsening:
                worsening_ids.add(eid)
            eid += 1
    return specs


def generate_financials_and_upi(
    spec: EnterpriseSpec, external_by_month: dict[date, dict], end_month: date, seed: int
) -> tuple[list[dict], list[dict]]:
    rng = _rng(seed + spec.id)
    months = month_seq(end_month, MONTHS_OF_HISTORY)
    financials = []
    upi = []
    cash_balance = spec.base_income * rng.uniform(0.5, 1.5)

    n = len(months)
    for idx, m in enumerate(months):
        ext = external_by_month[m]
        seasonal = 1.0
        if spec.sector in ("handicrafts", "rural_retail") and ext["festival_flag"]:
            seasonal *= 1.25
        if spec.sector == "dairy" and m.month in (11, 12, 1, 2):
            seasonal *= 1.10
        if spec.sector in ("dairy", "food_processing") and ext["drought_flag"]:
            seasonal *= 0.85
        if ext["flood_flag"]:
            seasonal *= 0.80

        demand_effect = ext["demand_index"] / 100
        income = spec.base_income * seasonal * demand_effect * rng.uniform(0.90, 1.10)

        cost_pressure = 1.0
        if spec.sector in ("dairy", "poultry"):
            cost_pressure *= ext["commodity_price_index"] / 100
        if spec.sector == "food_processing":
            cost_pressure *= (ext["commodity_price_index"] / 100) * rng.uniform(0.98, 1.05)

        expense_ratio = spec.expense_ratio * cost_pressure

        months_remaining = n - 1 - idx
        if spec.worsening and months_remaining < 4:
            months_into_decline = 4 - months_remaining
            severity = 1 + months_into_decline * 0.28
            income *= max(0.40, 1 - 0.18 * months_into_decline)
            expense_ratio = min(1.65, expense_ratio * severity)

        expense_ratio = float(np.clip(expense_ratio, 0.4, 1.65))
        expenses = income * expense_ratio * rng.uniform(0.95, 1.05)
        savings = max(0.0, (income - expenses) * rng.uniform(0.05, 0.20))

        cash_balance = cash_balance + income - expenses - savings
        working_capital = cash_balance * rng.uniform(0.85, 1.0)

        financials.append(
            dict(
                enterprise_id=spec.id,
                month=m,
                income=round(income, 2),
                expenses=round(expenses, 2),
                cash_balance=round(cash_balance, 2),
                working_capital=round(working_capital, 2),
                savings=round(savings, 2),
            )
        )

        digital_share = spec.digital_share
        if spec.worsening and months_remaining < 4:
            digital_share *= max(0.4, 1 - 0.18 * (4 - months_remaining))
        txn_volume = income * digital_share * rng.uniform(0.9, 1.1)
        txn_count = max(5, int(txn_volume / rng.uniform(300, 900)))
        avg_txn_value = txn_volume / txn_count if txn_count else 0.0

        upi.append(
            dict(
                enterprise_id=spec.id,
                month=m,
                txn_volume=round(txn_volume, 2),
                txn_count=txn_count,
                avg_txn_value=round(avg_txn_value, 2),
            )
        )

    return financials, upi


def generate_loans(spec: EnterpriseSpec, seed: int) -> list[dict]:
    rng = _rng(seed + 10_000 + spec.id)
    loans = []
    num_loans = rng.choice([0, 1, 2], p=[0.25, 0.55, 0.20])
    for _ in range(num_loans):
        principal = spec.base_income * rng.uniform(2, 8)
        outstanding = principal * rng.uniform(0.2, 0.9)
        monthly_repayment = principal * rng.uniform(0.03, 0.06)
        start_offset = int(rng.integers(3, MONTHS_OF_HISTORY))

        if spec.worsening:
            status = rng.choice(["on_time", "delayed", "defaulted"], p=[0.2, 0.55, 0.25])
            missed = int(rng.integers(1, 4))
        else:
            status = rng.choice(["on_time", "delayed", "defaulted"], p=[0.80, 0.17, 0.03])
            missed = int(rng.integers(0, 2)) if status != "on_time" else 0

        loans.append(
            dict(
                enterprise_id=spec.id,
                principal=round(principal, 2),
                outstanding=round(outstanding, 2),
                monthly_repayment=round(monthly_repayment, 2),
                repayment_status=status,
                start_month=date.today().replace(day=1),
                missed_payments_last_6m=missed,
                _start_offset=start_offset,
            )
        )
    return loans


@dataclass
class GeneratedDataset:
    enterprises: list[EnterpriseSpec]
    external_indicators: list[dict]
    financials: list[dict] = field(default_factory=list)
    upi_transactions: list[dict] = field(default_factory=list)
    loans: list[dict] = field(default_factory=list)


def generate_dataset(end_month: date | None = None, seed: int = 42) -> GeneratedDataset:
    end_month = (end_month or date.today()).replace(day=1)
    enterprises = generate_enterprises(seed)
    external = generate_external_indicators(end_month, seed)
    external_by_key: dict[tuple, dict] = {(r["sector"], r["state"], r["month"]): r for r in external}

    financials, upi, loans = [], [], []
    for spec in enterprises:
        external_by_month = {
            m: external_by_key[(spec.sector, spec.state, m)] for m in month_seq(end_month, MONTHS_OF_HISTORY)
        }
        f, u = generate_financials_and_upi(spec, external_by_month, end_month, seed)
        financials.extend(f)
        upi.extend(u)
        loans.extend(generate_loans(spec, seed))

    return GeneratedDataset(
        enterprises=enterprises,
        external_indicators=external,
        financials=financials,
        upi_transactions=upi,
        loans=loans,
    )
