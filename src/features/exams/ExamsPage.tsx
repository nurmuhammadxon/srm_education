import { useState } from "react"
import { Link } from "react-router-dom"
import type { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/DataTable"
import { Pagination } from "@/components/Pagination"
import { useDebounce } from "@/hooks/useDebounce"
import { useExams } from "./api"
import { ExamFormDialog } from "./ExamFormDialog"
import type { Exam } from "./types"

const PAGE_SIZE = 10

const formatDate = (iso: string) => iso.split("-").reverse().join(".")

const columns: ColumnDef<Exam>[] = [
  { accessorKey: "date", header: "Sana", cell: ({ getValue }) => formatDate(getValue<string>()) },
  {
    accessorKey: "title",
    header: "Imtihon",
    cell: ({ row }) => (
      <Link to={`/exams/${row.original.id}`} className="font-medium text-primary hover:underline">
        {row.original.title}
      </Link>
    ),
  },
  { accessorKey: "group_name", header: "Guruh" },
  { accessorKey: "max_score", header: "Eng yuqori ball" },
  {
    id: "graded",
    header: "Baholangan",
    cell: ({ row }) => {
      const { graded_count, students_count } = row.original
      const done = students_count > 0 && graded_count === students_count
      return (
        <Badge variant={done ? "default" : "secondary"}>
          {graded_count} / {students_count}
        </Badge>
      )
    },
  },
  {
    accessorKey: "average",
    header: "O'rtacha ball",
    cell: ({ getValue }) => getValue<number | null>() ?? "—",
  },
]

export default function ExamsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search)

  const { data, isLoading, isError, isFetching } = useExams({
    page,
    page_size: PAGE_SIZE,
    search: debouncedSearch,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Imtihonlar</h1>
        <div className="flex items-center gap-2">
          <Input
            className="w-64"
            placeholder="Imtihon yoki guruh bo'yicha qidirish..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          <ExamFormDialog />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        isFetching={isFetching}
        emptyText="Imtihonlar topilmadi"
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
    </div>
  )
}