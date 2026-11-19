import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/DataTable"
import { NativeSelect } from "@/components/NativeSelect"
import { Pagination } from "@/components/Pagination"
import { money } from "@/features/payments/utils"
import { useExpenses, useFinanceSummary } from "./api"
import { ExpenseFormDialog } from "./ExpenseFormDialog"
import { categoryLabels, type Expense, type ExpenseCategory } from "./types"

const PAGE_SIZE = 10

const formatDate = (iso: string) => iso.split("-").reverse().join(".")
const shortMoney = (v: number) => (v >= 1_000_000 ? `${v / 1_000_000}M` : `${v / 1000}k`)

const columns: ColumnDef<Expense>[] = [
  { accessorKey: "date", header: "Sana", cell: ({ getValue }) => formatDate(getValue<string>()) },
  {
    accessorKey: "category",
    header: "Toifa",
    cell: ({ getValue }) => <Badge variant="secondary">{categoryLabels[getValue<ExpenseCategory>()]}</Badge>,
  },
  {
    accessorKey: "amount",
    header: "Summa",
    cell: ({ getValue }) => <span className="font-medium">{money(getValue<number>())}</span>,
  },
  { accessorKey: "note", header: "Izoh", cell: ({ getValue }) => getValue<string | null>() ?? "—" },
]

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "danger" | "good" }) {
  const color = tone === "danger" ? "text-destructive" : tone === "good" ? "text-green-600" : ""
  return (
    <Card size="sm">
      <CardContent>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

export default function FinancePage() {
  const summary = useFinanceSummary()
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState<ExpenseCategory | "">("")
  const expenses = useExpenses({ page, page_size: PAGE_SIZE, category })

  const s = summary.data
  const maxCategory = Math.max(1, ...(s?.expense_by_category.map((c) => c.amount) ?? []))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Moliya</h1>
        <ExpenseFormDialog />
      </div>

      {summary.isLoading ? (
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      ) : summary.isError || !s ? (
        <p className="text-destructive">Moliya ma'lumotini yuklab bo'lmadi</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Shu oydagi tushum" value={money(s.month_income)} />
            <StatCard label="Shu oydagi xarajat" value={money(s.month_expense)} />
            <StatCard
              label="Sof foyda"
              value={money(s.month_profit)}
              tone={s.month_profit < 0 ? "danger" : "good"}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Tushum va xarajat (so'nggi 3 oy)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={s.by_month}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} tickFormatter={shortMoney} />
                      <Tooltip formatter={(v) => money(Number(v))} />
                      <Legend />
                      <Bar dataKey="income" name="Tushum" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Xarajat" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shu oydagi xarajatlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {s.expense_by_category.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Bu oy xarajat yo'q</p>
                ) : (
                  s.expense_by_category.map((c) => (
                    <div key={c.category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{categoryLabels[c.category]}</span>
                        <span className="font-medium">{money(c.amount)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-destructive/70"
                          style={{ width: `${(c.amount / maxCategory) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Xarajatlar ro'yxati</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Yig'indi: <span className="font-medium text-foreground">{money(expenses.data?.total_amount ?? 0)}</span>
            </span>
            <NativeSelect
              className="w-40"
              aria-label="Toifa bo'yicha filtr"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as ExpenseCategory | "")
                setPage(1)
              }}
            >
              <option value="">Barcha toifalar</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={expenses.data?.items}
          isLoading={expenses.isLoading}
          isError={expenses.isError}
          isFetching={expenses.isFetching}
          emptyText="Xarajatlar topilmadi"
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={expenses.data?.total ?? 0} onPageChange={setPage} />
      </div>
    </div>
  )
}