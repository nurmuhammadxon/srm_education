import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/stores/auth"
import type { ExpenseCategory, Expense, ExpensesResponse, FinanceSummary, NewExpense } from "./types"

export function useFinanceSummary() {
  const branchId = useAuth((s) => s.branchId)
  return useQuery({
    queryKey: ["finance", branchId],
    queryFn: async () => (await api.get<FinanceSummary>("/finance/summary")).data,
    enabled: branchId !== null,
  })
}

export function useExpenses(params: { page: number; page_size: number; category: ExpenseCategory | "" }) {
  const branchId = useAuth((s) => s.branchId)
  return useQuery({
    queryKey: ["expenses", branchId, params],
    queryFn: async () => (await api.get<ExpensesResponse>("/expenses", { params })).data,
    placeholderData: keepPreviousData,
    enabled: branchId !== null,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: NewExpense) => (await api.post<Expense>("/expenses", body)).data,
    // xarajat ro'yxatni ham, yuqoridagi foyda va grafikni ham o'zgartiradi
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["expenses"] }),
        queryClient.invalidateQueries({ queryKey: ["finance"] }),
      ]),
  })
}