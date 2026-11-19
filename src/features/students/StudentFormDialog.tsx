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
import { useCreateStudent } from "./api"

const schema = z.object({
  first_name: z.string().min(2, "Ismni kiriting"),
  last_name: z.string().min(2, "Familiyani kiriting"),
  phone: z.string().min(9, "Telefon raqamni kiriting"),
  parent_name: z.string().optional(),
  parent_phone: z.string().optional(),
})
type Form = z.infer<typeof schema>

const fields: { name: keyof Form; label: string; placeholder?: string }[] = [
  { name: "first_name", label: "Ism" },
  { name: "last_name", label: "Familiya" },
  { name: "phone", label: "Telefon", placeholder: "+998901234567" },
  { name: "parent_name", label: "Ota-onasining ismi (ixtiyoriy)" },
  { name: "parent_phone", label: "Ota-onasining telefoni (ixtiyoriy)", placeholder: "+998901234567" },
]

export function StudentFormDialog() {
  const [open, setOpen] = useState(false)
  const { mutateAsync, isPending } = useCreateStudent()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) reset()
  }

  async function onSubmit(values: Form) {
    try {
      await mutateAsync(values)
      toast.success("O'quvchi qo'shildi")
      handleOpenChange(false)
    } catch {
      toast.error("Saqlab bo'lmadi, qayta urinib ko'ring")
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> O'quvchi qo'shish
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi o'quvchi</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {fields.map((f) => (
              <div key={f.name} className="space-y-2">
                <Label htmlFor={f.name}>{f.label}</Label>
                <Input id={f.name} placeholder={f.placeholder} {...register(f.name)} />
                {errors[f.name] && <p className="text-sm text-destructive">{errors[f.name]?.message}</p>}
              </div>
            ))}
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