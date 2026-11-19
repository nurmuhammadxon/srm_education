export type ExpenseCategory = "rent" | "salary" | "utilities" | "marketing" | "other"

export const categoryLabels: Record<ExpenseCategory, string> = {
  rent: "Ijara",
  salary: "Maosh",
  utilities: "Kommunal",
  marketing: "Marketing",
  other: "Boshqa",
}

export interface Expense {
  id: number
  category: ExpenseCategory
  amount: number
  note: string | null
  date: string // YYYY-MM-DD
}

export interface NewExpense {
  category: ExpenseCategory
  amount: number
  note?: string
  date: string
}

export interface ExpensesResponse {
  items: Expense[]
  total: number
  page: number
  page_size: number
  total_amount: number // filtrga mos xarajatlar yig'indisi
}

export interface FinanceSummary {
  month_income: number
  month_expense: number
  month_profit: number
  by_month: { month: string; label: string; income: number; expense: number }[]
  expense_by_category: { category: ExpenseCategory; amount: number }[]
}