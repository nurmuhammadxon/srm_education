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
import { useCourses } from "@/features/references/api"
import { useCreateLead } from "./api"
import { leadSources } from "./types"

const schema = z.object({
  full_name: z.string().min(2, "Ismni kiriting"),
  phone: z.string().min(9, "Telefon raqamni kiriting"),
  course_id: z.string().optional(),
  source: z.string().min(1, "Manbani tanlang"),
  note: z.string().optional(),
})
type Form = z.infer<typeof schema>

export function LeadFormDialog() {
  const [open, setOpen] = useState(false)
  const { data: courses } = useCourses()
  const { mutateAsync, isPending } = useCreateLead()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { source: leadSources[0] } })

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) reset()
  }

  async function onSubmit(values: Form) {
    try {
      await mutateAsync({
        full_name: values.full_name,
        phone: values.phone,
        course_id: values.course_id ? Number(values.course_id) : undefined,
        source: values.source,
        note: values.note?.trim() || undefined,
      })
      toast.success("Lid qo'shildi")
      handleOpenChange(false)
    } catch (e) {
      toast.error(getErrorMessage(e, "Saqlab bo'lmadi, qayta urinib ko'ring"))
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Lid qo'shish
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi lid</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lead-name">F.I.Sh.</Label>
              <Input id="lead-name" {...register("full_name")} />
              {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-phone">Telefon</Label>
              <Input id="lead-phone" placeholder="+998901234567" {...register("phone")} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-course">Qiziqqan kurs (ixtiyoriy)</Label>
              <NativeSelect id="lead-course" {...register("course_id")}>
                <option value="">Tanlanmagan</option>
                {courses?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-source">Manba</Label>
              <NativeSelect id="lead-source" {...register("source")}>
                {leadSources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </NativeSelect>
              {errors.source && <p className="text-sm text-destructive">{errors.source.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-note">Izoh (ixtiyoriy)</Label>
              <Input id="lead-note" {...register("note")} />
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