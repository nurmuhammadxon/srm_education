export type PaymentMethod = "cash" | "card" | "transfer"

export interface Payment {
  id: number
  student_id: number
  student_name: string
  amount: number
  method: PaymentMethod
  note: string | null
  paid_at: string // ISO sana-vaqt
  received_by: string
}

export interface NewPayment {
  student_id: number
  amount: number
  method: PaymentMethod
  note?: string
}

export interface Debtor {
  student_id: number
  student_name: string
  phone: string
  group: string
  debt: number // musbat son: qancha qarz
}

export interface DebtorsResponse {
  items: Debtor[]
  total: number
  page: number
  page_size: number
  total_debt: number // barcha qarzdorlarning umumiy qarzi
}

export interface PaymentsResponse {
  items: Payment[]
  total: number
  page: number
  page_size: number
  total_amount: number // filtrga mos to'lovlar yig'indisi
}
