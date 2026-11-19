import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NativeSelect } from "@/components/NativeSelect"
import { cn } from "@/lib/utils"
import { getErrorMessage } from "@/lib/errors"
import { useDebounce } from "@/hooks/useDebounce"
import { useStudents } from "@/features/students/api"
import { useCreatePayment } from "./api"
import { methodLabels, money } from "./utils"
import type { PaymentMethod } from "./types"

export interface PaymentPreset {
  student_id: number
  student_name: string
  debt?: number
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  preset?: PaymentPreset | null
}

export function PaymentFormDialog({ open, onOpenChange, preset }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>To'lov qabul qilish</DialogTitle>
        </DialogHeader>
        {/* forma faqat dialog ochilganda yuklanadi, yopilganda holati tozalanadi */}
        <PaymentForm preset={preset ?? null} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function PaymentForm({ preset, onDone }: { preset: PaymentPreset | null; onDone: () => void }) {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search)
  const [selectedId, setSelectedId] = useState<number | null>(preset?.student_id ?? null)
  const [selectedName, setSelectedName] = useState(preset?.student_name ?? "")
  const [amount, setAmount] = useState(preset?.debt ? String(preset.debt) : "")
  const [method, setMethod] = useState<PaymentMethod>("cash")
  const [note, setNote] = useState("")

  const { data: students, isLoading } = useStudents({ page: 1, page_size: 6, search: debouncedSearch })
  const create = useCreatePayment()

  const amountNumber = Number(amount.replaceAll(" ", ""))
  const amountValid = Number.isInteger(amountNumber) && amountNumber > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedId === null || !amountValid) return
    try {
      await create.mutateAsync({
        student_id: selectedId,
        amount: amountNumber,
        method,
        note: note.trim() || undefined,
      })
      toast.success(`${money(amountNumber)} to'lov qabul qilindi`)
      onDone()
    } catch (err) {
      toast.error(getErrorMessage(err, "To'lovni saqlab bo'lmadi"))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {preset ? (
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <div className="font-medium">{preset.student_name}</div>
          {preset.debt ? <div className="text-destructive">Qarzi: {money(preset.debt)}</div> : null}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="payment-student-search">O'quvchi</Label>
          <Input
            id="payment-student-search"
            placeholder="Ism yoki telefon bo'yicha qidiring..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-44 divide-y overflow-y-auto rounded-md border">
            {isLoading ? (
              <p className="p-3 text-sm text-muted-foreground">Yuklanmoqda...</p>
            ) : students?.items.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">O'quvchi topilmadi</p>
            ) : (
              students?.items.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(s.id)
                    setSelectedName(`${s.last_name} ${s.first_name}`)
                    // qarzi bo'lsa, summa avtomatik to'ldiriladi
                    if (s.balance < 0) setAmount(String(-s.balance))
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted",
                    selectedId === s.id && "bg-primary/10"
                  )}
                >
                  <span>
                    {s.last_name} {s.first_name}
                  </span>
                  <span className={s.balance < 0 ? "text-destructive" : "text-muted-foreground"}>
                    {s.balance < 0 ? `Qarz: ${money(-s.balance)}` : s.phone}
                  </span>
                </button>
              ))
            )}
          </div>
          {selectedId !== null && <p className="text-sm text-muted-foreground">Tanlandi: {selectedName}</p>}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="payment-amount">Summa (so'm)</Label>
        <Input
          id="payment-amount"
          inputMode="numeric"
          placeholder="400000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {amount !== "" && !amountValid && (
          <p className="text-sm text-destructive">Summani butun son bilan kiriting</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment-method">To'lov usuli</Label>
        <NativeSelect id="payment-method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
          {Object.entries(methodLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment-note">Izoh (ixtiyoriy)</Label>
        <Input id="payment-note" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Bekor qilish
        </Button>
        <Button type="submit" disabled={selectedId === null || !amountValid || create.isPending}>
          {create.isPending ? "Saqlanmoqda..." : "Qabul qilish"}
        </Button>
      </DialogFooter>
    </form>
  )
}
