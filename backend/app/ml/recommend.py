"""Deterministic recommendation engine: maps the top SHAP risk drivers (plus
sector context) to actionable recommendation templates. Rule-based rather
than LLM-generated so it's reliable and reproducible for a live demo."""

GENERIC_RECOMMENDATIONS = {
    "income_trend_3m": (
        "Diversify your income sources",
        "Income has been declining over the last 3 months. Consider adding a second buyer, "
        "product line, or sales channel to reduce dependence on a single source.",
    ),
    "expense_income_ratio": (
        "Trim non-essential expenses",
        "Expenses are taking up a large share of income. Review recurring costs and postpone "
        "non-urgent purchases until the cash flow trend improves.",
    ),
    "cash_buffer_months": (
        "Build a cash buffer",
        "Your current cash reserves would cover only a few months of expenses. Set aside a small "
        "fixed amount from each month's income until you have at least 3 months of buffer.",
    ),
    "upi_txn_trend_3m": (
        "Re-engage your customers",
        "Digital transaction volume has dropped recently, suggesting fewer or smaller sales. "
        "Consider local promotions or checking in with regular customers.",
    ),
    "missed_payments_last_6m_max": (
        "Talk to your lender early",
        "Recent loan repayments have been missed or delayed. Contact your bank or NABARD-linked "
        "institution proactively to discuss a revised repayment schedule before it escalates.",
    ),
    "has_defaulted": (
        "Address the loan default",
        "An existing loan is in default. Prioritize a repayment plan with your lender — early "
        "resolution protects future credit access.",
    ),
    "savings_ratio": (
        "Increase your savings rate",
        "Very little of your income is currently being saved. Even a small consistent savings "
        "habit improves resilience to future shocks.",
    ),
    "commodity_price_index": (
        "Lock in input costs",
        "Input/commodity prices in your sector are trending up. Where possible, negotiate bulk or "
        "advance-purchase deals with suppliers to reduce exposure to further price rises.",
    ),
    "demand_index": (
        "Explore alternate markets",
        "Local demand has softened. Look into nearby markets, aggregator platforms, or FPO/SHG "
        "collective selling to reach more buyers.",
    ),
    "drought_flag": (
        "Plan for dry conditions",
        "Drought conditions have been flagged for your region. Consider water-conservation "
        "measures and check eligibility for weather-indexed crop/livestock insurance.",
    ),
    "flood_flag": (
        "Prepare for flood risk",
        "Flood conditions have been flagged for your region. Safeguard stock/inventory and check "
        "eligibility for disaster relief or insurance support.",
    ),
    "loan_repayment_burden": (
        "Review loan repayment load",
        "Monthly loan repayments are consuming a significant share of your cash flow. Consider "
        "discussing restructuring options with your lender.",
    ),
    "income_roll3_std": (
        "Smooth out income volatility",
        "Your income has been fluctuating month to month. Staggering sales or production can help "
        "even out cash flow.",
    ),
    "outstanding_loan_total": (
        "Monitor total loan exposure",
        "Outstanding loan amounts are relatively high relative to your income. Avoid taking on "
        "additional debt until existing obligations are more comfortably covered.",
    ),
}

SECTOR_OVERRIDES = {
    ("commodity_price_index", "dairy"): (
        "Manage feed cost exposure",
        "Feed prices are trending up. Consider bulk purchase during price dips or explore local "
        "fodder cultivation to reduce dependence on market feed prices.",
    ),
    ("commodity_price_index", "poultry"): (
        "Manage feed cost exposure",
        "Feed costs are rising. Explore group purchasing with nearby poultry units to negotiate "
        "better rates.",
    ),
    ("demand_index", "handicrafts"): (
        "Plan for festival demand",
        "Demand in handicrafts is highly seasonal. Pre-book raw materials ahead of the festival "
        "season to avoid last-minute price spikes and stock-outs.",
    ),
    ("demand_index", "rural_retail"): (
        "Adjust inventory to demand cycles",
        "Local demand has softened. Re-balance inventory toward higher-turnover items and monitor "
        "UPI sales trends weekly.",
    ),
    ("drought_flag", "dairy"): (
        "Secure fodder and water supply",
        "Drought conditions raise fodder and water costs for dairy animals. Check regional fodder "
        "banks and drought-relief schemes.",
    ),
}


def build_recommendations(sector: str, drivers: list[dict], level: str) -> list[dict]:
    if level == "low" and not any(d["direction"] == "increases_risk" for d in drivers):
        return [
            dict(
                title="Keep up the good work",
                detail="Your financial indicators are currently healthy. Continue maintaining "
                "your savings habit and monitoring cash flow monthly.",
                driver="none",
            )
        ]

    recs = []
    seen_titles = set()
    for d in drivers:
        if d["direction"] != "increases_risk":
            continue
        key = (d["feature"], sector)
        title, detail = SECTOR_OVERRIDES.get(key, GENERIC_RECOMMENDATIONS.get(d["feature"], (None, None)))
        if title is None or title in seen_titles:
            continue
        seen_titles.add(title)
        recs.append(dict(title=title, detail=detail, driver=d["feature"]))
        if len(recs) >= 3:
            break

    if not recs:
        recs.append(
            dict(
                title="Continue monitoring",
                detail="No single dominant risk factor was detected, but keep tracking income, "
                "expenses, and repayments monthly.",
                driver="none",
            )
        )
    return recs
