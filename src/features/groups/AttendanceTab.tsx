import { useState } from "react"
import { addMonths, format, parseISO } from "date-fns"
import { uz } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useGroupLessons, useLesson, useSaveAttendance } from "./api"
import type { AttendanceRecord, AttendanceStatus } from "./types"

const options: { value: AttendanceStatus; label: string; active: string }[] = [
  { value: "present", label: "Keldi", active: "bg-green-600 text-white hover:bg-green-600 hover:text-white" },
  { value: "absent", label: "Kelmadi", active: "bg-red-600 text-white hover:bg-red-600 hover:text-white" },
  { value: "late", label: "Kechikdi", active: "bg-amber-500 text-white hover:bg-amber-500 hover:text-white" },
  { value: "excused", label: "Sababli", active: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white" },
]

export function AttendanceTab({ groupId }: { groupId: number }) {
  const [month, setMonth] = useState(() => new Date())
  const [lessonId, setLessonId] = useState<number | null>(null)
  const { data: lessons, isLoading } = useGroupLessons(groupId, format(month, "yyyy-MM"))

  function changeMonth(delta: number) {
    setMonth((m) => addMonths(m, delta))
    setLessonId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-36 text-center font-medium capitalize">
          {format(month, "LLLL yyyy", { locale: uz })}
        </span>
        <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      ) : !lessons || lessons.length === 0 ? (
        <p className="text-muted-foreground">Bu oyda dars yo'q</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {lessons.map((l) => (
            <Button
              key={l.id}
              size="sm"
              variant={l.id === lessonId ? "default" : "outline"}
              onClick={() => setLessonId(l.id)}
            >
              {format(parseISO(l.date), "d MMM, EEE", { locale: uz })}
            </Button>
          ))}
        </div>
      )}

      {/* key: dars almashganda tahrirlar tozalanadi */}
      {lessonId !== null && <AttendanceEditor key={lessonId} lessonId={lessonId} />}
    </div>
  )
}

function AttendanceEditor({ lessonId }: { lessonId: number }) {
  const { data, isLoading, isError } = useLesson(lessonId)
  const save = useSaveAttendance(lessonId)
  const [edits, setEdits] = useState<Record<number, AttendanceStatus>>({})

  if (isLoading) return <p className="text-muted-foreground">Yuklanmoqda...</p>
  if (isError || !data) return <p className="text-destructive">Darsni yuklab bo'lmadi</p>
  if (data.records.length === 0) return <p className="text-muted-foreground">Guruhda o'quvchi yo'q</p>

  const records = data.records
  const statusOf = (r: AttendanceRecord) => edits[r.student_id] ?? r.status
  const hasChanges = Object.keys(edits).length > 0

  const markAllPresent = () =>
    setEdits(Object.fromEntries(records.map((r) => [r.student_id, "present" as AttendanceStatus])))

  const handleSave = async () => {
    const payload = records.flatMap((r) => {
      const s = statusOf(r)
      return s ? [{ student_id: r.student_id, status: s }] : []
    })
    try {
      await save.mutateAsync(payload)
      toast.success("Davomat saqlandi")
      setEdits({})
    } catch {
      toast.error("Saqlab bo'lmadi, qayta urinib ko'ring")
    }
  }

  return (
    <div className="space-y-3">
      <Card className="gap-0 divide-y py-0">
        {records.map((r, i) => (
          <div key={r.student_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <span className="text-sm">
              <span className="mr-2 text-muted-foreground">{i + 1}.</span>
              {r.student_name}
            </span>
            <div className="flex gap-1">
              {options.map((o) => (
                <Button
                  key={o.value}
                  size="sm"
                  variant="outline"
                  className={cn(statusOf(r) === o.value && o.active)}
                  onClick={() => setEdits((prev) => ({ ...prev, [r.student_id]: o.value }))}
                >
                  {o.label}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={markAllPresent}>
          Hammasi keldi
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || save.isPending}>
          {save.isPending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </div>
  )
}