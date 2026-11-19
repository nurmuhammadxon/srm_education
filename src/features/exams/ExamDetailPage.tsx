import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { getErrorMessage } from "@/lib/errors"
import { useExam, useSaveGrades } from "./api"

const formatDate = (iso: string) => iso.split("-").reverse().join(".")

// bo'sh qiymat yoki 0 dan eng yuqori ballgacha butun son
const isValid = (v: string, max: number) => v === "" || (/^\d{1,4}$/.test(v) && Number(v) <= max)

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardContent>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  )
}

export default function ExamDetailPage() {
  const { id } = useParams()
  const examId = Number(id)
  const { data: exam, isLoading, isError } = useExam(examId)
  const save = useSaveGrades(examId)
  // faqat o'zgartirilgan kataklar: o'quvchi id -> kiritilgan matn
  const [edits, setEdits] = useState<Record<number, string>>({})

  if (isLoading) return <p className="text-muted-foreground">Yuklanmoqda...</p>

  if (isError || !exam) {
    return (
      <div className="space-y-3">
        <p className="text-destructive">Imtihon topilmadi</p>
        <Link to="/exams" className="text-sm text-primary hover:underline">
          Imtihonlarga qaytish
        </Link>
      </div>
    )
  }

  const saved = exam.grades.flatMap((g) => (g.score === null ? [] : [g.score]))
  const highest = saved.length ? Math.max(...saved) : null

  const hasInvalid = Object.values(edits).some((v) => !isValid(v, exam.max_score))
  const changed = Object.entries(edits)
    .filter(([, v]) => v !== "" && isValid(v, exam.max_score))
    .map(([sid, v]) => ({ student_id: Number(sid), score: Number(v) }))

  async function handleSave() {
    try {
      await save.mutateAsync(changed)
      setEdits({})
      toast.success("Ballar saqlandi")
    } catch (e) {
      toast.error(getErrorMessage(e, "Saqlab bo'lmadi"))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/exams" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Imtihonlar
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{exam.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {exam.group_name} · {formatDate(exam.date)} · Eng yuqori ball: {exam.max_score}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Baholangan" value={`${exam.graded_count} / ${exam.students_count}`} />
        <Stat label="O'rtacha ball" value={exam.average === null ? "—" : String(exam.average)} />
        <Stat label="Eng yuqori natija" value={highest === null ? "—" : String(highest)} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>O'quvchi</TableHead>
              <TableHead className="w-40">Ball</TableHead>
              <TableHead>Natija</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exam.grades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Guruhda o'quvchilar yo'q
                </TableCell>
              </TableRow>
            ) : (
              exam.grades.map((g) => {
                const value = edits[g.student_id] ?? (g.score === null ? "" : String(g.score))
                const invalid = !isValid(value, exam.max_score)
                const passed = g.score !== null && g.score / exam.max_score >= 0.6
                return (
                  <TableRow key={g.student_id}>
                    <TableCell>{g.student_name}</TableCell>
                    <TableCell>
                      <Input
                        className={cn("w-24", invalid && "border-destructive")}
                        inputMode="numeric"
                        placeholder="—"
                        aria-label={`${g.student_name} balli`}
                        value={value}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [g.student_id]: e.target.value }))}
                      />
                      {invalid && <p className="mt-1 text-xs text-destructive">0 dan {exam.max_score} gacha</p>}
                    </TableCell>
                    <TableCell>
                      {g.score === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <Badge variant={passed ? "default" : "destructive"}>{passed ? "O'tdi" : "O'tmadi"}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {changed.length > 0 && <span className="text-sm text-muted-foreground">{changed.length} ta o'zgarish</span>}
        <Button onClick={handleSave} disabled={changed.length === 0 || hasInvalid || save.isPending}>
          {save.isPending ? "Saqlanmoqda..." : "Ballarni saqlash"}
        </Button>
      </div>
    </div>
  )
}