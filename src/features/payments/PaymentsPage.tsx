import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { HandCoins, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/DataTable"
import { NativeSelect } from "@/components/NativeSelect"
import { Pagination } from "@/components/Pagination"
import { useDebounce } from "@/hooks/useDebounce"
import { useDebtors, usePayments } from "./api"
import { PaymentFormDialog, type PaymentPreset } from "./PaymentFormDialog"
import { formatDateTime, methodLabels, money } from "./utils"
import type { Debtor, Payment, PaymentMethod } from "./types"

const PAGE_SIZE = 10

const paymentColumns: ColumnDef<Payment>[] = [
  { accessorKey: "paid_at", header: "Sana", cell: ({ getValue }) => formatDateTime(getValue<string>()) },
  { accessorKey: "student_name", header: "O'quvchi" },
  {
    accessorKey: "amount",
    header: "Summa",
    cell: ({ getValue }) => <span className="font-medium">{money(getValue<number>())}</span>,
  },
  {
    accessorKey: "method",
    header: "Usul",
    cell: ({ getValue }) => <Badge variant="secondary">{methodLabels[getValue<PaymentMethod>()]}</Badge>,
  },
  { accessorKey: "received_by", header: "Qabul qildi" },
  { accessorKey: "note", header: "Izoh", cell: ({ getValue }) => getValue<string | null>() ?? "—" },
]

export default function PaymentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [preset, setPreset] = useState<PaymentPreset | null>(null)

  function openDialog(p: PaymentPreset | null) {
    setPreset(p)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">To'lovlar</h1>
        <Button onClick={() => openDialog(null)}>
          <Plus className="size-4" /> To'lov qabul qilish
        </Button>
      </div>

      <Tabs defaultValue="payments">
        <TabsList>
          <TabsTrigger value="payments">To'lovlar ro'yxati</TabsTrigger>
          <TabsTrigger value="debtors">Qarzdorlar</TabsTrigger>
        </TabsList>
        <TabsContent value="payments" className="mt-4">
          <PaymentsTab />
        </TabsContent>
        <TabsContent value="debtors" className="mt-4">
          <DebtorsTab onReceive={openDialog} />
        </TabsContent>
      </Tabs>

      <PaymentFormDialog open={dialogOpen} onOpenChange={setDialogOpen} preset={preset} />
    </div>
  )
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <Card size="sm" className="w-fit min-w-56">
      <CardContent>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={tone === "danger" ? "text-xl font-semibold text-destructive" : "text-xl font-semibold"}>
          {value}
        </div>
      </CardContent>
    </Card>
  )
}

function PaymentsTab() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [method, setMethod] = useState<PaymentMethod | "">("")
  const debouncedSearch = useDebounce(search)

  const { data, isLoading, isError, isFetching } = usePayments({
    page,
    page_size: PAGE_SIZE,
    search: debouncedSearch,
    method,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SummaryCard label="Ro'yxatdagi to'lovlar yig'indisi" value={money(data?.total_amount ?? 0)} />
        <div className="flex items-center gap-2">
          <Input
            className="w-64"
            placeholder="O'quvchi ismi bo'yicha qidirish..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          <NativeSelect
            className="w-36"
            aria-label="To'lov usuli bo'yicha filtr"
            value={method}
            onChange={(e) => {
              setMethod(e.target.value as PaymentMethod | "")
              setPage(1)
            }}
          >
            <option value="">Barcha usullar</option>
            {Object.entries(methodLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <DataTable
        columns={paymentColumns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        isFetching={isFetching}
        emptyText="To'lovlar topilmadi"
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
    </div>
  )
}

function DebtorsTab({ onReceive }: { onReceive: (p: PaymentPreset) => void }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search)

  const { data, isLoading, isError, isFetching } = useDebtors({
    page,
    page_size: PAGE_SIZE,
    search: debouncedSearch,
  })

  const columns: ColumnDef<Debtor>[] = [
    { accessorKey: "student_name", header: "F.I.Sh." },
    { accessorKey: "phone", header: "Telefon" },
    { accessorKey: "group", header: "Guruh" },
    {
      accessorKey: "debt",
      header: "Qarz",
      cell: ({ getValue }) => <span className="font-medium text-destructive">{money(getValue<number>())}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            onReceive({
              student_id: row.original.student_id,
              student_name: row.original.student_name,
              debt: row.original.debt,
            })
          }
        >
          <HandCoins className="size-4" /> To'lov
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SummaryCard label="Umumiy qarz" value={money(data?.total_debt ?? 0)} tone="danger" />
        <Input
          className="w-64"
          placeholder="Ism yoki telefon bo'yicha qidirish..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        isFetching={isFetching}
        emptyText="Qarzdorlar yo'q"
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
    </div>
  )
}
