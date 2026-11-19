import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const EMPTY: never[] = [] // har renderda yangi [] yaratmaslik uchun

interface Props<T> {
  columns: ColumnDef<T>[]
  data: T[] | undefined
  isLoading?: boolean
  isError?: boolean
  isFetching?: boolean
  emptyText?: string
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  isFetching,
  emptyText = "Ma'lumot topilmadi",
}: Props<T>) {
  const table = useReactTable({ data: data ?? EMPTY, columns, getCoreRowModel: getCoreRowModel() })
  const rows = table.getRowModel().rows

  return (
    <Card className={isFetching && !isLoading ? "opacity-70 transition-opacity" : ""}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Yuklanmoqda...
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-destructive">
                Ma'lumotni yuklab bo'lmadi
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  )
}