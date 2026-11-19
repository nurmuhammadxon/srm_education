import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/DataTable"
import { Pagination } from "@/components/Pagination"
import { useDebounce } from "@/hooks/useDebounce"
import { useAuth } from "@/stores/auth"
import { useStudents } from "./api"
import { StudentFormDialog } from "./StudentFormDialog"
import type { Student } from "./types"

const PAGE_SIZE = 10

const statusMap = {
  active: { label: "Faol", variant: "default" },
  frozen: { label: "Muzlatilgan", variant: "secondary" },
  graduated: { label: "Bitirgan", variant: "outline" },
  left: { label: "Ketgan", variant: "destructive" },
} as const

const money = (n: number) => `${new Intl.NumberFormat("uz-UZ").format(n)} so'm`

const columns: ColumnDef<Student>[] = [
  { id: "fullName", header: "F.I.Sh.", accessorFn: (r) => `${r.last_name} ${r.first_name}` },
  { accessorKey: "phone", header: "Telefon" },
  { accessorKey: "group", header: "Guruh" },
  {
    accessorKey: "status",
    header: "Holati",
    cell: ({ getValue }) => {
      const s = statusMap[getValue<Student["status"]>()]
      return <Badge variant={s.variant}>{s.label}</Badge>
    },
  },
  {
    accessorKey: "balance",
    header: "Balans",
    cell: ({ getValue }) => {
      const v = getValue<number>()
      return <span className={v < 0 ? "font-medium text-destructive" : ""}>{money(v)}</span>
    },
  },
]

export default function StudentsPage() {
  const role = useAuth((s) => s.user?.role)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search)

  const { data, isLoading, isError, isFetching } = useStudents({
    page,
    page_size: PAGE_SIZE,
    search: debouncedSearch,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">O'quvchilar</h1>
        <div className="flex items-center gap-2">
          <Input
            className="w-64"
            placeholder="Ism yoki telefon bo'yicha qidirish..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          {role !== "teacher" && <StudentFormDialog />}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        isFetching={isFetching}
        emptyText="O'quvchilar topilmadi"
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
    </div>
  )
}