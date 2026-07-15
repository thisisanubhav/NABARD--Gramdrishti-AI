export type Role = "enterprise_owner" | "field_officer";
export type Sector = "dairy" | "poultry" | "food_processing" | "handicrafts" | "rural_retail";
export type EnterpriseSize = "micro" | "small" | "medium";
export type RiskLevel = "low" | "medium" | "high";
export type RepaymentStatus = "on_time" | "delayed" | "defaulted";

export interface UserOut {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  enterprise_id: number | null;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: UserOut;
}

export interface EnterpriseOut {
  id: number;
  name: string;
  sector: Sector;
  state: string;
  district: string;
  years_in_operation: number;
  size: EnterpriseSize;
}

export interface FinancialRecordOut {
  month: string;
  income: number;
  expenses: number;
  cash_balance: number;
  working_capital: number;
  savings: number;
}

export interface LoanOut {
  id: number;
  principal: number;
  outstanding: number;
  monthly_repayment: number;
  repayment_status: RepaymentStatus;
  start_month: string;
  missed_payments_last_6m: number;
}

export interface ForecastPoint {
  month: string;
  predicted_cash_balance: number;
  lower_bound: number;
  upper_bound: number;
}

export interface ForecastOut {
  enterprise_id: number;
  generated_at: string;
  history: FinancialRecordOut[];
  forecast: ForecastPoint[];
}

export interface RiskDriver {
  feature: string;
  label: string;
  impact: number;
  direction: "increases_risk" | "decreases_risk";
}

export interface RiskOut {
  enterprise_id: number;
  level: RiskLevel;
  score: number;
  horizon_months: number;
  message: string;
  drivers: RiskDriver[];
  generated_at: string;
}

export interface Recommendation {
  title: string;
  detail: string;
  driver: string;
}

export interface RecommendationsOut {
  enterprise_id: number;
  recommendations: Recommendation[];
}

export interface OfficerEnterpriseRow {
  enterprise_id: number;
  name: string;
  sector: Sector;
  state: string;
  district: string;
  risk_level: RiskLevel;
  risk_score: number;
  cash_balance: number;
  top_driver: string;
}

export interface SectorBreakdown {
  sector: Sector;
  count: number;
  avg_risk_score: number;
  high_risk_count: number;
}

export interface OfficerSummary {
  total_enterprises: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  sector_breakdown: SectorBreakdown[];
}

export interface TransactionEntryInput {
  type: "income" | "expense" | "savings";
  amount: number;
  month?: string;
}

export interface LoanEntryInput {
  principal: number;
  outstanding: number;
  monthly_repayment: number;
  repayment_status: RepaymentStatus;
  start_month: string;
}
