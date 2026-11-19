import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth, type Branch, type User } from "@/stores/auth"
import type { Course } from "@/features/references/api"

export interface Staff {
  id: number
  first_name: string
  last_name: string
  phone: string
  role: "admin" | "teacher"
}

export interface NewStaff {
  first_name: string
  last_name: string
  phone: string
  role: "admin" | "teacher"
}

export interface NewCourse {
  name: string
  monthly_price: number
}

export function useStaff() {
  const branchId = useAuth((s) => s.branchId)
  return useQuery({
    queryKey: ["staff", branchId],
    queryFn: async () => (await api.get<Staff[]>("/staff")).data,
    enabled: branchId !== null,
  })
}

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: async () => (await api.get<Branch[]>("/branches")).data,
  })
}

export function useCreateCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: NewCourse) => (await api.post<Course>("/courses", body)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  })
}

export function useCreateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: NewStaff) => (await api.post<Staff>("/staff", body)).data,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["staff"] }),
        queryClient.invalidateQueries({ queryKey: ["teachers"] }),
      ]),
  })
}

export function useCreateBranch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string }) => (await api.post<Branch>("/branches", body)).data,
    onSuccess: async () => {
      // filial tanlagich foydalanuvchi ma'lumotidan olinadi, shuning uchun uni yangilaymiz
      const { data } = await api.get<User>("/auth/me")
      useAuth.getState().setUser(data)
      await queryClient.invalidateQueries({ queryKey: ["branches"] })
    },
  })
}