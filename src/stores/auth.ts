import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Role = "ceo" | "admin" | "teacher"

export interface Branch {
  id: number
  name: string
}

export interface User {
  id: number
  first_name: string
  last_name: string
  role: Role
  branches: Branch[]
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  branchId: number | null
  setTokens: (access: string, refresh: string) => void
  setUser: (user: User) => void
  setBranch: (id: number) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      branchId: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) =>
        set({
          user,
          branchId: user.branches.some((b) => b.id === get().branchId)
            ? get().branchId
            : (user.branches[0]?.id ?? null),
        }),
      setBranch: (branchId) => set({ branchId }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null, branchId: null }),
    }),
    { name: "srm-auth" }
  )
)