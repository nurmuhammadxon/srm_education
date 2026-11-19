import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/stores/auth"
import type { DebtorsResponse, NewPayment, Payment, PaymentMethod, PaymentsResponse } from "./types"

export function usePayments(params: { page: number; page_size: number; search: string; method: PaymentMethod | "" }) {
  const branchId = useAuth((s) => s.branchId)
  return useQuery({
    queryKey: ["payments", branchId, params],
    queryFn: async () => (await api.get<PaymentsResponse>("/payments", { params })).data,
    placeholderData: keepPreviousData,
    enabled: branchId !== null,
  })
}

export function useDebtors(params: { page: number; page_size: number; search: string }) {
  const branchId = useAuth((s) => s.branchId)
  return useQuery({
    queryKey: ["debtors", branchId, params],
    queryFn: async () => (await api.get<DebtorsResponse>("/debtors", { params })).data,
    placeholderData: keepPreviousData,
    enabled: branchId !== null,
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: NewPayment) => (await api.post<Payment>("/payments", body)).data,
    // to'lov o'quvchi balansiga ta'sir qiladi: uchala ro'yxat ham yangilanadi
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
        queryClient.invalidateQueries({ queryKey: ["debtors"] }),
        queryClient.invalidateQueries({ queryKey: ["students"] }),
      ]),
  })
}
