import type { PaymentMethod } from "./types"

export const methodLabels: Record<PaymentMethod, string> = {
  cash: "Naqd",
  card: "Karta",
  transfer: "O'tkazma",
}

export const money = (n: number) => `${new Intl.NumberFormat("uz-UZ").format(n)} so'm`

export function formatDateTime(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}
