import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/DataTable"
import { useAuth } from "@/stores/auth"
import { getErrorMessage } from "@/lib/errors"
import { AddStudentDialog } from "./AddStudentDialog"
import { useGroupStudents, useRemoveGroupStudent } from "./api"
import type { GroupStudent } from "./types"

const statusMap = {
  active: { label: "Faol", variant: "default" },
  frozen: { label: "Muzlatilgan", variant: "secondary" },
  left: { label: "Chiqib ketgan", variant: "destructive" },
} as const

const baseColumns: ColumnDef<GroupStudent>[] = [
  { id: "fullName", header: "F.I.Sh.", accessorFn: (r) => `${r.last_name} ${r.first_name}` },
  { accessorKey: "phone", header: "Telefon" },
  {
    accessorKey: "discount_percent",
    header: "Chegirma",
    cell: ({ getValue }) => `${getValue<number>()}%`,
  },
  {
    accessorKey: "joined_at",
    header: "Qo'shilgan",
    cell: ({ getValue }) => format(parseISO(getValue<string>()), "dd.MM.yyyy"),
  },
  {
    accessorKey: "status",
    header: "Holati",
    cell: ({ getValue }) => {
      const s = statusMap[getValue<GroupStudent["status"]>()]
      return <Badge variant={s.variant}>{s.label}</Badge>
    },
  },
]

export function GroupStudentsTab({ groupId }: { groupId: number }) {
  const role = useAuth((s) => s.user?.role)
  const canEdit = role !== "teacher"
  const { data, isLoading, isError, isFetching } = useGroupStudents(groupId)
  const { mutate: removeStudent } = useRemoveGroupStudent(groupId)

  const columns = useMemo<ColumnDef<GroupStudent>[]>(() => {
    if (!canEdit) return baseColumns
    return [
      ...baseColumns,
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            title="Guruhdan chiqarish"
            onClick={() => {
              const s = row.original
              if (!window.confirm(`${s.last_name} ${s.first_name} guruhdan chiqarilsinmi?`)) return
              removeStudent(s.student_id, {
                onSuccess: () => toast.success("O'quvchi guruhdan chiqarildi"),
                onError: (e) => toast.error(getErrorMessage(e, "Chiqarib bo'lmadi")),
              })
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        ),
      },
    ]
  }, [canEdit, removeStudent])

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <AddStudentDialog groupId={groupId} />
        </div>
      )}
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        isFetching={isFetching}
        emptyText="Guruhda hali o'quvchi yo'q"
      />
    </div>
  )
}