import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/stores/auth"
import type { Lead, LeadStatus, NewLead } from "./types"

export function useLeads() {
  const branchId = useAuth((s) => s.branchId)
  return useQuery({
    queryKey: ["leads", branchId],
    queryFn: async () => (await api.get<Lead[]>("/leads")).data,
    enabled: branchId !== null,
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: NewLead) => (await api.post<Lead>("/leads", body)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  })
}

// Karta ustunga o'tganda darrov ko'rinadi (optimistik), xato bo'lsa orqaga qaytadi
export function useMoveLead() {
  const queryClient = useQueryClient()
  const branchId = useAuth((s) => s.branchId)
  const key = ["leads", branchId]

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: LeadStatus }) =>
      (await api.patch<Lead>(`/leads/${id}`, { status })).data,
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Lead[]>(key)
      queryClient.setQueryData<Lead[]>(key, (old) => old?.map((l) => (l.id === id ? { ...l, status } : l)))
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  })
}