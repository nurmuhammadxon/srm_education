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
import { useCreateExam, useGroupOptions } from "./api"

const schema = z.object({
  group_id: z.string().min(1, "Guruhni tanlang"),
  title: z.string().min(2, "Imtihon nomini kiriting"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sanani tanlang"),
  max_score: z.string().regex(/^[1-9]\d{0,3}$/, "Eng yuqori ballni butun son bilan kiriting"),
})
type Form = z.infer<typeof schema>

const todayISO = () => new Date().toLocaleDateString("sv-SE")
const defaults = (): Form => ({ group_id: "", title: "", date: todayISO(), max_score: "100" })

export function ExamFormDialog() {
  const [open, setOpen] = useState(false)
  const { data: groups } = useGroupOptions()
  const { mutateAsync, isPending } = useCreateExam()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: defaults() })

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) reset(defaults())
  }

  async function onSubmit(v: Form) {
    try {
      await mutateAsync({
        group_id: Number(v.group_id),
        title: v.title.trim(),
        date: v.date,
        max_score: Number(v.max_score),
      })
      toast.success("Imtihon qo'shildi")
      handleOpenChange(false)
    } catch (e) {
      toast.error(getErrorMessage(e, "Saqlab bo'lmadi, qayta urinib ko'ring"))
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Imtihon qo'shish
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi imtihon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exam-group">Guruh</Label>
              <NativeSelect id="exam-group" {...register("group_id")}>
                <option value="">Tanlang</option>
                {groups
                  ?.filter((g) => g.status !== "finished")
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} · {g.course_name}
                    </option>
                  ))}
              </NativeSelect>
              {errors.group_id && <p className="text-sm text-destructive">{errors.group_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam-title">Imtihon nomi</Label>
              <Input id="exam-title" placeholder="Masalan: Oraliq nazorat" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="exam-date">Sana</Label>
                <Input id="exam-date" type="date" {...register("date")} />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="exam-max">Eng yuqori ball</Label>
                <Input id="exam-max" inputMode="numeric" {...register("max_score")} />
                {errors.max_score && <p className="text-sm text-destructive">{errors.max_score.message}</p>}
              </div>
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