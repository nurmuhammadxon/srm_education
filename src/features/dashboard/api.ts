import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/stores/auth"
import type { LeadStatus } from "@/features/leads/types"

export interface DashboardData {
  active_students: number
  active_groups: number
  month_revenue: number
  total_debt: number
  debtors_count: number
  revenue_by_day: { date: string; amount: number }[]
  leads_by_status: Record<LeadStatus, number>
  top_debtors: { student_id: number; student_name: string; debt: number }[]
}

export function useDashboard() {
  const branchId = useAuth((s) => s.branchId)
  return useQuery({
    queryKey: ["dashboard", branchId],
    queryFn: async () => (await api.get<DashboardData>("/dashboard")).data,
    enabled: branchId !== null,
  })
}