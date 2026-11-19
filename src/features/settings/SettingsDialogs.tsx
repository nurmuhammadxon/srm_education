import { useState, type ReactNode } from "react"
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
import { useCreateBranch, useCreateCourse, useCreateStaff } from "./api"

/* ---------- umumiy qismlar ---------- */

function FormDialog({
  triggerLabel,
  title,
  children,
}: {
  triggerLabel: string
  title: string
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {/* forma faqat dialog ochiq paytda bor, yopilganda holati tozalanadi */}
          {children(() => setOpen(false))}
        </DialogContent>
      </Dialog>
    </>
  )
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

function Footer({ pending, onCancel }: { pending: boolean; onCancel: () => void }) {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel}>
        Bekor qilish
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? "Saqlanmoqda..." : "Saqlash"}
      </Button>
    </DialogFooter>
  )
}

/* ---------- Kurs ---------- */

const courseSchema = z.object({
  name: z.string().min(2, "Kurs nomini kiriting"),
  monthly_price: z.string().regex(/^[1-9]\d*$/, "Narxni butun son bilan kiriting"),
})
type CourseForm = z.infer<typeof courseSchema>

function CourseFormBody({ onDone }: { onDone: () => void }) {
  const create = useCreateCourse()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseForm>({ resolver: zodResolver(courseSchema) })

  async function onSubmit(v: CourseForm) {
    try {
      await create.mutateAsync({ name: v.name, monthly_price: Number(v.monthly_price) })
      toast.success("Kurs qo'shildi")
      onDone()
    } catch (e) {
      toast.error(getErrorMessage(e, "Saqlab bo'lmadi"))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field id="course-name" label="Kurs nomi" error={errors.name?.message}>
        <Input id="course-name" {...register("name")} />
      </Field>
      <Field id="course-price" label="Oylik narxi (so'm)" error={errors.monthly_price?.message}>
        <Input id="course-price" inputMode="numeric" placeholder="400000" {...register("monthly_price")} />
      </Field>
      <Footer pending={create.isPending} onCancel={onDone} />
    </form>
  )
}

export function CourseFormDialog() {
  return (
    <FormDialog triggerLabel="Kurs qo'shish" title="Yangi kurs">
      {(close) => <CourseFormBody onDone={close} />}
    </FormDialog>
  )
}

/* ---------- Xodim ---------- */

const staffSchema = z.object({
  first_name: z.string().min(2, "Ismni kiriting"),
  last_name: z.string().min(2, "Familiyani kiriting"),
  phone: z.string().min(9, "Telefon raqamni kiriting"),
  role: z.enum(["admin", "teacher"]),
})
type StaffForm = z.infer<typeof staffSchema>

function StaffFormBody({ onDone }: { onDone: () => void }) {
  const create = useCreateStaff()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffForm>({ resolver: zodResolver(staffSchema), defaultValues: { role: "teacher" } })

  async function onSubmit(v: StaffForm) {
    try {
      await create.mutateAsync(v)
      toast.success("Xodim qo'shildi")
      onDone()
    } catch (e) {
      toast.error(getErrorMessage(e, "Saqlab bo'lmadi"))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field id="staff-first" label="Ism" error={errors.first_name?.message}>
        <Input id="staff-first" {...register("first_name")} />
      </Field>
      <Field id="staff-last" label="Familiya" error={errors.last_name?.message}>
        <Input id="staff-last" {...register("last_name")} />
      </Field>
      <Field id="staff-phone" label="Telefon" error={errors.phone?.message}>
        <Input id="staff-phone" placeholder="+998901234567" {...register("phone")} />
      </Field>
      <Field id="staff-role" label="Lavozimi" error={errors.role?.message}>
        <NativeSelect id="staff-role" {...register("role")}>
          <option value="teacher">O'qituvchi</option>
          <option value="admin">Admin</option>
        </NativeSelect>
      </Field>
      <Footer pending={create.isPending} onCancel={onDone} />
    </form>
  )
}

export function StaffFormDialog() {
  return (
    <FormDialog triggerLabel="Xodim qo'shish" title="Yangi xodim">
      {(close) => <StaffFormBody onDone={close} />}
    </FormDialog>
  )
}

/* ---------- Filial ---------- */

const branchSchema = z.object({ name: z.string().min(2, "Filial nomini kiriting") })
type BranchForm = z.infer<typeof branchSchema>

function BranchFormBody({ onDone }: { onDone: () => void }) {
  const create = useCreateBranch()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BranchForm>({ resolver: zodResolver(branchSchema) })

  async function onSubmit(v: BranchForm) {
    try {
      await create.mutateAsync(v)
      toast.success("Filial qo'shildi")
      onDone()
    } catch (e) {
      toast.error(getErrorMessage(e, "Saqlab bo'lmadi"))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field id="branch-name" label="Filial nomi" error={errors.name?.message}>
        <Input id="branch-name" placeholder="Masalan: Sergeli filiali" {...register("name")} />
      </Field>
      <Footer pending={create.isPending} onCancel={onDone} />
    </form>
  )
}

export function BranchFormDialog() {
  return (
    <FormDialog triggerLabel="Filial qo'shish" title="Yangi filial">
      {(close) => <BranchFormBody onDone={close} />}
    </FormDialog>
  )
}