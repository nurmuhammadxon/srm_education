import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/stores/auth"

export interface Course {
  id: number
  name: string
  monthly_price: number
}

export interface Teacher {
  id: number
  full_name: string
}

export function useCourses() {
  const branchId = useAuth((s) => s.branchId)
  return useQuery({
    queryKey: ["courses", branchId],
    queryFn: async () => (await api.get<Course[]>("/courses")).data,
    enabled: branchId !== null,
  })
}

export function useTeachers() {
  const branchId = useAuth((s) => s.branchId)
  return useQuery({
    queryKey: ["teachers", branchId],
    queryFn: async () => (await api.get<Teacher[]>("/teachers")).data,
    enabled: branchId !== null,
  })
}