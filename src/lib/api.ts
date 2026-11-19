import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import { useAuth } from "@/stores/auth"

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`

export const api = axios.create({ baseURL: BASE })

api.interceptors.request.use((config) => {
  const { accessToken, branchId } = useAuth.getState()
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  if (branchId) config.headers["X-Branch-Id"] = String(branchId)
  return config
})

let refreshing: Promise<string> | null = null

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const { refreshToken, setTokens, logout } = useAuth.getState()

    const canRefresh =
      error.response?.status === 401 &&
      !original._retry &&
      refreshToken &&
      !original.url?.includes("/auth/")

    if (canRefresh) {
      original._retry = true
      try {
        refreshing ??= axios
          .post(`${BASE}/auth/refresh`, { refresh_token: refreshToken })
          .then((r) => {
            setTokens(r.data.access_token, r.data.refresh_token ?? refreshToken)
            return r.data.access_token as string
          })
          .finally(() => {
            refreshing = null
          })

        const token = await refreshing
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch {
        logout()
      }
    }
    return Promise.reject(error)
  }
)