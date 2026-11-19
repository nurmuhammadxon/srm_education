import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/stores/auth"
import type { Paginated } from "@/features/students/types"
import type { Group, GroupStudent, Lesson, LessonDetail, NewGroup, AttendanceInput } from "./types"

export function useGroups(params: { page: number; page_size: number; search: string }) {
  const branchId = useAuth((s) => s.branchId)
  return useQuery({
    queryKey: ["groups", branchId, params],
    queryFn: async () => (await api.get<Paginated<Group>>("/groups", { params })).data,
    placeholderData: keepPreviousData,
    enabled: branchId !== null,
  })
}

export function useGroup(id: number) {
  const branchId = useAuth((s) => s.branchId)
  return useQuery({
    queryKey: ["group", branchId, id],
    queryFn: async () => (await api.get<Group>(`/groups/${id}`)).data,
    enabled: branchId !== null,
  })
}

export function useGroupStudents(id: number) {
  const branchId = useAuth((s) => s.branchId)
  return useQuery({
    queryKey: ["group-students", branchId, id],
    queryFn: async () => (await api.get<GroupStudent[]>(`/groups/${id}/students`)).data,
    enabled: branchId !== null,
  })
}

export function useGroupLessons(id: number, month: string) {
  const branchId = useAuth((s) => s.branchId)
  return useQuery({
    queryKey: ["group-lessons", branchId, id, month],
    queryFn: async () => (await api.get<Lesson[]>(`/groups/${id}/lessons`, { params: { month } })).data,
    enabled: branchId !== null,
  })
}

export function useLesson(id: number) {
  const branchId = useAuth((s) => s.branchId)
  return useQuery({
    queryKey: ["lesson", branchId, id],
    queryFn: async () => (await api.get<LessonDetail>(`/lessons/${id}`)).data,
    enabled: branchId !== null,
  })
}

export function useSaveAttendance(lessonId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (records: AttendanceInput[]) =>
      (await api.post(`/lessons/${lessonId}/attendance`, records)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lesson"] }),
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: NewGroup) => (await api.post<Group>("/groups", body)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  })
}

// guruh tarkibi o'zgarsa: o'quvchilar ro'yxati, guruhlar soni va davomat ro'yxati yangilanadi
function invalidateGroupData(queryClient: QueryClient) {
  return Promise.all(
    ["group-students", "groups", "lesson"].map((key) => queryClient.invalidateQueries({ queryKey: [key] }))
  )
}

export function useAddGroupStudent(groupId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { student_id: number; discount_percent: number }) =>
      (await api.post(`/groups/${groupId}/students`, body)).data,
    onSuccess: () => invalidateGroupData(queryClient),
  })
}

export function useRemoveGroupStudent(groupId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (studentId: number) => {
      await api.delete(`/groups/${groupId}/students/${studentId}`)
    },
    onSuccess: () => invalidateGroupData(queryClient),
  })
}