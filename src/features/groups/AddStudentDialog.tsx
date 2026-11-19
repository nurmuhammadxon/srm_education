import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { getErrorMessage } from "@/lib/errors"
import { useDebounce } from "@/hooks/useDebounce"
import { useStudents } from "@/features/students/api"
import { useAddGroupStudent, useGroupStudents } from "./api"

export function AddStudentDialog({ groupId }: { groupId: number }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> O'quvchi qo'shish
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guruhga o'quvchi qo'shish</DialogTitle>
          </DialogHeader>
          {/* forma faqat dialog ochilganda yuklanadi */}
          <AddStudentForm groupId={groupId} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}

function AddStudentForm({ groupId, onDone }: { groupId: number; onDone: () => void }) {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [discount, setDiscount] = useState("0")

  const { data: students, isLoading } = useStudents({ page: 1, page_size: 8, search: debouncedSearch })
  const { data: members } = useGroupStudents(groupId)
  const add = useAddGroupStudent(groupId)

  const memberIds = new Set((members ?? []).map((m) => m.student_id))
  const discountValid = /^\d{1,3}$/.test(discount) && Number(discount) <= 100

  const handleAdd = async () => {
    if (selectedId === null) return
    try {
      await add.mutateAsync({ student_id: selectedId, discount_percent: Number(discount) })
      toast.success("O'quvchi guruhga qo'shildi")
      onDone()
    } catch (e) {
      toast.error(getErrorMessage(e, "Qo'shib bo'lmadi"))
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="student-search">O'quvchini qidiring</Label>
        <Input
          id="student-search"
          placeholder="Ism yoki telefon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="max-h-56 divide-y overflow-y-auto rounded-md border">
        {isLoading ? (
          <p className="p-3 text-sm text-muted-foreground">Yuklanmoqda...</p>
        ) : students?.items.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">O'quvchi topilmadi</p>
        ) : (
          students?.items.map((s) => {
            const inGroup = memberIds.has(s.id)
            return (
              <button
                key={s.id}
                type="button"
                disabled={inGroup}
                onClick={() => setSelectedId(s.id)}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
                  selectedId === s.id && "bg-primary/10"
                )}
              >
                <span>
                  {s.last_name} {s.first_name}
                </span>
                <span className="text-muted-foreground">{inGroup ? "Guruhda" : s.phone}</span>
              </button>
            )
          })
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="discount">Chegirma (%)</Label>
        <Input id="discount" inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value)} />
        {!discountValid && <p className="text-sm text-destructive">0 dan 100 gacha son kiriting</p>}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Bekor qilish
        </Button>
        <Button onClick={handleAdd} disabled={selectedId === null || !discountValid || add.isPending}>
          {add.isPending ? "Qo'shilmoqda..." : "Qo'shish"}
        </Button>
      </DialogFooter>
    </div>
  )
}