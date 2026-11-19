import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/stores/auth"
import type { NewStudent, Paginated, Student } from "./types"

export function useStudents(params: { page: number; page_size: number; search: string }) {
  const branchId = useAuth((s) => s.branchId)
  return useQuery({
    queryKey: ["students", branchId, params],
    queryFn: async () => (await api.get<Paginated<Student>>("/students", { params })).data,
    placeholderData: keepPreviousData,
    enabled: branchId !== null,
  })
}

export function useCreateStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: NewStudent) => (await api.post<Student>("/students", body)).data,
    // saqlangach ro'yxat o'zi yangilanadi
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  })
}