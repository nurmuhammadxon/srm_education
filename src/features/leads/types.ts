export type LeadStatus = "new" | "contacted" | "trial" | "enrolled" | "lost"

export interface Lead {
  id: number
  full_name: string
  phone: string
  course_name: string | null
  source: string
  note: string | null
  status: LeadStatus
  created_at: string
}

export interface NewLead {
  full_name: string
  phone: string
  course_id?: number
  source: string
  note?: string
}

export const leadStages: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "Yangi" },
  { value: "contacted", label: "Bog'lanildi" },
  { value: "trial", label: "Sinov darsi" },
  { value: "enrolled", label: "Yozildi" },
  { value: "lost", label: "Rad etdi" },
]

export const leadSources = ["Instagram", "Telegram", "Tanish-bilish", "Sayt", "Boshqa"]