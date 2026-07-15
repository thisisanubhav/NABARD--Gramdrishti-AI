import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  EnterpriseOut,
  FinancialRecordOut,
  ForecastOut,
  LoanEntryInput,
  LoanOut,
  OfficerEnterpriseRow,
  OfficerSummary,
  RecommendationsOut,
  RiskOut,
  Sector,
  Token,
  TransactionEntryInput,
} from "./types";

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const { data } = await apiClient.post<Token>("/auth/login", payload);
      return data;
    },
  });
}

export function useEnterprises() {
  return useQuery({
    queryKey: ["enterprises"],
    queryFn: async () => (await apiClient.get<EnterpriseOut[]>("/enterprises")).data,
  });
}

export function useEnterprise(id: number | undefined) {
  return useQuery({
    queryKey: ["enterprise", id],
    queryFn: async () => (await apiClient.get<EnterpriseOut>(`/enterprises/${id}`)).data,
    enabled: !!id,
  });
}

export function useFinancials(id: number | undefined) {
  return useQuery({
    queryKey: ["financials", id],
    queryFn: async () =>
      (await apiClient.get<FinancialRecordOut[]>(`/enterprises/${id}/financials`)).data,
    enabled: !!id,
  });
}

export function useLoans(id: number | undefined) {
  return useQuery({
    queryKey: ["loans", id],
    queryFn: async () => (await apiClient.get<LoanOut[]>(`/enterprises/${id}/loans`)).data,
    enabled: !!id,
  });
}

export function useForecast(id: number | undefined) {
  return useQuery({
    queryKey: ["forecast", id],
    queryFn: async () => (await apiClient.get<ForecastOut>(`/enterprises/${id}/forecast`)).data,
    enabled: !!id,
  });
}

export function useRisk(id: number | undefined) {
  return useQuery({
    queryKey: ["risk", id],
    queryFn: async () => (await apiClient.get<RiskOut>(`/enterprises/${id}/risk`)).data,
    enabled: !!id,
  });
}

export function useRecommendations(id: number | undefined) {
  return useQuery({
    queryKey: ["recommendations", id],
    queryFn: async () =>
      (await apiClient.get<RecommendationsOut>(`/enterprises/${id}/recommendations`)).data,
    enabled: !!id,
  });
}

export function useAddTransaction(enterpriseId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TransactionEntryInput) =>
      (await apiClient.post(`/enterprises/${enterpriseId}/transactions`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financials", enterpriseId] });
      queryClient.invalidateQueries({ queryKey: ["forecast", enterpriseId] });
      queryClient.invalidateQueries({ queryKey: ["risk", enterpriseId] });
      queryClient.invalidateQueries({ queryKey: ["recommendations", enterpriseId] });
    },
  });
}

export function useAddLoan(enterpriseId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: LoanEntryInput) =>
      (await apiClient.post(`/enterprises/${enterpriseId}/loans`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", enterpriseId] });
      queryClient.invalidateQueries({ queryKey: ["risk", enterpriseId] });
      queryClient.invalidateQueries({ queryKey: ["recommendations", enterpriseId] });
    },
  });
}

export function useOfficerEnterprises(filters: { sector?: Sector; risk?: string; state?: string }) {
  return useQuery({
    queryKey: ["officer-enterprises", filters],
    queryFn: async () =>
      (
        await apiClient.get<OfficerEnterpriseRow[]>("/officer/enterprises", {
          params: filters,
        })
      ).data,
  });
}

export function useOfficerSummary() {
  return useQuery({
    queryKey: ["officer-summary"],
    queryFn: async () => (await apiClient.get<OfficerSummary>("/officer/summary")).data,
  });
}
