export interface Student {
  id: number
  first_name: string
  last_name: string
  phone: string
  status: "active" | "frozen" | "graduated" | "left"
  balance: number
  group?: string
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface NewStudent {
  first_name: string
  last_name: string
  phone: string
  parent_name?: string
  parent_phone?: string
}