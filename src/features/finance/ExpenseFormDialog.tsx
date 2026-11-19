import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NativeSelect } from "@/components/NativeSelect"
import { getErrorMessage } from "@/lib/errors"
import { useCreateExpense } from "./api"
import { categoryLabels } from "./types"

const schema = z.object({
  category: z.enum(["rent", "salary", "utilities", "marketing", "other"]),
  amount: z.string().regex(/^[1-9]\d*$/, "Summani butun son bilan kiriting"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sanani tanlang"),
  note: z.string().optional(),
})
type Form = z.infer<typeof schema>

// bugungi sana YYYY-MM-DD ko'rinishida (mahalliy vaqt bo'yicha)
const todayISO = () => new Date().toLocaleDateString("sv-SE")

export function ExpenseFormDialog() {
  const [open, setOpen] = useState(false)
  const { mutateAsync, isPending } = useCreateExpense()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { category: "rent", date: todayISO() },
  })

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) reset({ category: "rent", date: todayISO(), amount: "", note: "" })
  }

  async function onSubmit(v: Form) {
    try {
      await mutateAsync({
        category: v.category,
        amount: Number(v.amount),
        date: v.date,
        note: v.note?.trim() || undefined,
      })
      toast.success("Xarajat qo'shildi")
      handleOpenChange(false)
    } catch (e) {
      toast.error(getErrorMessage(e, "Saqlab bo'lmadi, qayta urinib ko'ring"))
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Xarajat qo'shish
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi xarajat</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-category">Toifa</Label>
              <NativeSelect id="expense-category" {...register("category")}>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-amount">Summa (so'm)</Label>
              <Input id="expense-amount" inputMode="numeric" placeholder="1000000" {...register("amount")} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-date">Sana</Label>
              <Input id="expense-date" type="date" {...register("date")} />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-note">Izoh (ixtiyoriy)</Label>
              <Input id="expense-note" {...register("note")} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}