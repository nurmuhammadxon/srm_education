import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/stores/auth"
import type { Paginated } from "@/features/students/types"
import type { Group } from "@/features/groups/types"
import type { Exam, ExamDetail, GradeInput, NewExam } from "./types"

export function useExams(params: { page: number; page_size: number; search: string }) {
  const branchId = useAuth((s) => s.branchId)
  return useQuery({
    queryKey: ["exams", branchId, params],
    queryFn: async () => (await api.get<Paginated<Exam>>("/exams", { params })).data,
    placeholderData: keepPreviousData,
    enabled: branchId !== null,
  })
}

export function useExam(id: number) {
  const branchId = useAuth((s) => s.branchId)
  return useQuery({
    queryKey: ["exam", branchId, id],
    queryFn: async () => (await api.get<ExamDetail>(`/exams/${id}`)).data,
    enabled: branchId !== null && Number.isFinite(id),
  })
}

// imtihon yaratish formasidagi guruhlar ro'yxati
export function useGroupOptions() {
  const branchId = useAuth((s) => s.branchId)
  return useQuery({
    queryKey: ["groups", "options", branchId],
    queryFn: async () =>
      (await api.get<Paginated<Group>>("/groups", { params: { page: 1, page_size: 100, search: "" } })).data.items,
    enabled: branchId !== null,
  })
}

export function useCreateExam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: NewExam) => (await api.post<Exam>("/exams", body)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exams"] }),
  })
}

export function useSaveGrades(examId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (grades: GradeInput[]) =>
      (await api.post<{ saved: number }>(`/exams/${examId}/grades`, grades)).data,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["exam"] }),
        queryClient.invalidateQueries({ queryKey: ["exams"] }),
      ]),
  })
}