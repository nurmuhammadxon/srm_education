import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NativeSelect } from "@/components/NativeSelect"
import { getErrorMessage } from "@/lib/errors"
import { useCourses, useTeachers } from "@/features/references/api"
import { useCreateGroup } from "./api"
import { weekdayNames } from "./utils"

const schema = z
  .object({
    name: z.string().min(2, "Guruh nomini kiriting"),
    course_id: z.string().min(1, "Kursni tanlang"),
    teacher_id: z.string().min(1, "O'qituvchini tanlang"),
    weekdays: z.array(z.number()).min(1, "Kamida bitta kunni tanlang"),
    start_time: z.string().min(1, "Boshlanish vaqtini kiriting"),
    end_time: z.string().min(1, "Tugash vaqtini kiriting"),
    start_date: z.string().min(1, "Boshlanish sanasini kiriting"),
    monthly_price: z.string().regex(/^\d+$/, "Narxni raqam bilan kiriting"),
  })
  .refine((d) => !d.start_time || !d.end_time || d.end_time > d.start_time, {
    message: "Tugash vaqti boshlanishdan keyin bo'lsin",
    path: ["end_time"],
  })
type Form = z.infer<typeof schema>

const defaultValues: Form = {
  name: "",
  course_id: "",
  teacher_id: "",
  weekdays: [],
  start_time: "",
  end_time: "",
  start_date: format(new Date(), "yyyy-MM-dd"),
  monthly_price: "",
}

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-sm text-destructive">{message}</p> : null

export function GroupFormDialog() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const createGroup = useCreateGroup()
  const { data: courses } = useCourses()
  const { data: teachers } = useTeachers()
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues })

  const weekdays = watch("weekdays")

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) reset(defaultValues)
  }

  function toggleWeekday(day: number) {
    const next = weekdays.includes(day) ? weekdays.filter((d) => d !== day) : [...weekdays, day]
    setValue("weekdays", next.sort((a, b) => a - b), { shouldValidate: true })
  }

  async function onSubmit(v: Form) {
    try {
      const group = await createGroup.mutateAsync({
        name: v.name,
        course_id: Number(v.course_id),
        teacher_id: Number(v.teacher_id),
        weekdays: v.weekdays,
        start_time: v.start_time,
        end_time: v.end_time,
        start_date: v.start_date,
        monthly_price: Number(v.monthly_price),
      })
      toast.success("Guruh yaratildi")
      handleOpenChange(false)
      navigate(`/groups/${group.id}`) // darrov guruh sahifasiga o'tamiz, o'quvchi qo'shish uchun
    } catch (e) {
      toast.error(getErrorMessage(e, "Guruhni saqlab bo'lmadi"))
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Guruh yaratish
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yangi guruh</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Guruh nomi</Label>
              <Input id="name" placeholder="Masalan: Ingliz tili A1 - 18:00" {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course_id">Kurs</Label>
              <NativeSelect
                id="course_id"
                {...register("course_id", {
                  // kurs tanlanganda narx avtomatik to'ladi
                  onChange: (e) => {
                    const course = courses?.find((c) => String(c.id) === e.target.value)
                    if (course) setValue("monthly_price", String(course.monthly_price), { shouldValidate: true })
                  },
                })}
              >
                <option value="">Tanlang</option>
                {courses?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
              <FieldError message={errors.course_id?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacher_id">O'qituvchi</Label>
              <NativeSelect id="teacher_id" {...register("teacher_id")}>
                <option value="">Tanlang</option>
                {teachers?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
              </NativeSelect>
              <FieldError message={errors.teacher_id?.message} />
            </div>

            <div className="space-y-2">
              <Label>Dars kunlari</Label>
              <div className="flex flex-wrap gap-2">
                {weekdayNames.map((name, i) => (
                  <Button
                    key={name}
                    type="button"
                    size="sm"
                    variant={weekdays.includes(i) ? "default" : "outline"}
                    onClick={() => toggleWeekday(i)}
                  >
                    {name}
                  </Button>
                ))}
              </div>
              <FieldError message={errors.weekdays?.message} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start_time">Boshlanishi</Label>
                <Input id="start_time" type="time" {...register("start_time")} />
                <FieldError message={errors.start_time?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Tugashi</Label>
                <Input id="end_time" type="time" {...register("end_time")} />
                <FieldError message={errors.end_time?.message} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start_date">Guruh boshlanish sanasi</Label>
                <Input id="start_date" type="date" {...register("start_date")} />
                <FieldError message={errors.start_date?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_price">Oylik narx (so'm)</Label>
                <Input id="monthly_price" inputMode="numeric" placeholder="500000" {...register("monthly_price")} />
                <FieldError message={errors.monthly_price?.message} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={createGroup.isPending}>
                {createGroup.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}