import type { Group } from "./types"

export const weekdayNames = ["Du", "Se", "Chor", "Pay", "Ju", "Sha", "Yak"]

export const groupStatusMap = {
  recruiting: { label: "Qabul davom etmoqda", variant: "secondary" },
  active: { label: "Faol", variant: "default" },
  finished: { label: "Tugagan", variant: "outline" },
} as const

export function formatSchedule(g: Pick<Group, "weekdays" | "start_time" | "end_time">) {
  return `${g.weekdays.map((d) => weekdayNames[d]).join(", ")} · ${g.start_time}-${g.end_time}`
}