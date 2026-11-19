import { useState } from "react"
import { toast } from "sonner"
import { Phone } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NativeSelect } from "@/components/NativeSelect"
import { cn } from "@/lib/utils"
import { getErrorMessage } from "@/lib/errors"
import { useLeads, useMoveLead } from "./api"
import { LeadFormDialog } from "./LeadFormDialog"
import { leadStages, type Lead, type LeadStatus } from "./types"

export default function LeadsPage() {
  const { data, isLoading, isError } = useLeads()
  const move = useMoveLead()
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [overColumn, setOverColumn] = useState<LeadStatus | null>(null)

  async function moveLead(lead: Lead, status: LeadStatus) {
    if (lead.status === status) return
    try {
      await move.mutateAsync({ id: lead.id, status })
    } catch (e) {
      toast.error(getErrorMessage(e, "Lidni ko'chirib bo'lmadi"))
    }
  }

  function handleDrop(status: LeadStatus) {
    const lead = data?.find((l) => l.id === draggingId)
    setDraggingId(null)
    setOverColumn(null)
    if (lead) void moveLead(lead, status)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Lidlar</h1>
        <LeadFormDialog />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      ) : isError ? (
        <p className="text-destructive">Lidlarni yuklab bo'lmadi</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {leadStages.map((stage) => {
            const items = (data ?? []).filter((l) => l.status === stage.value)
            return (
              <div
                key={stage.value}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOverColumn(stage.value)
                }}
                onDragLeave={() => setOverColumn((c) => (c === stage.value ? null : c))}
                onDrop={() => handleDrop(stage.value)}
                className={cn(
                  "flex w-72 shrink-0 flex-col gap-2 rounded-xl bg-muted/60 p-3 transition-colors",
                  overColumn === stage.value && "bg-primary/10 ring-2 ring-primary/30"
                )}
              >
                <div className="flex items-center justify-between px-1 text-sm font-medium">
                  {stage.label}
                  <Badge variant="secondary">{items.length}</Badge>
                </div>

                {items.length === 0 && (
                  <p className="px-1 py-6 text-center text-xs text-muted-foreground">Bo'sh</p>
                )}

                {items.map((lead) => (
                  <Card
                    key={lead.id}
                    size="sm"
                    draggable
                    onDragStart={() => setDraggingId(lead.id)}
                    onDragEnd={() => {
                      setDraggingId(null)
                      setOverColumn(null)
                    }}
                    className={cn("cursor-grab active:cursor-grabbing", draggingId === lead.id && "opacity-50")}
                  >
                    <div className="space-y-2 px-(--card-spacing)">
                      <div className="font-medium">{lead.full_name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="size-3" /> {lead.phone}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {lead.course_name && <Badge variant="outline">{lead.course_name}</Badge>}
                        <Badge variant="secondary">{lead.source}</Badge>
                      </div>
                      {lead.note && <p className="text-xs text-muted-foreground">{lead.note}</p>}
                      {/* telefonda sudrash qulay emas, shuning uchun select ham bor */}
                      <NativeSelect
                        aria-label="Bosqichni o'zgartirish"
                        className="h-8 text-xs"
                        value={lead.status}
                        onChange={(e) => void moveLead(lead, e.target.value as LeadStatus)}
                      >
                        {leadStages.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                  </Card>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}