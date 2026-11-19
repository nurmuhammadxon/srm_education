import { Link } from "react-router-dom"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/stores/auth"
import { money } from "@/features/payments/utils"
import { leadStages } from "@/features/leads/types"
import { useDashboard } from "./api"

function StatCard({ label, value, hint, danger }: { label: string; value: string; hint?: string; danger?: boolean }) {
  return (
    <Card size="sm">
      <CardContent>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={danger ? "text-2xl font-semibold text-destructive" : "text-2xl font-semibold"}>{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  )
}

const shortMoney = (v: number) => (v >= 1_000_000 ? `${v / 1_000_000}M` : `${v / 1000}k`)

export default function DashboardPage() {
  const role = useAuth((s) => s.user?.role)
  const { data, isLoading, isError } = useDashboard()

  if (isLoading) return <p className="text-muted-foreground">Yuklanmoqda...</p>
  if (isError || !data) return <p className="text-destructive">Ma'lumotni yuklab bo'lmadi</p>

  // o'qituvchiga pul va lidlar ko'rinmaydi
  const showMoney = role !== "teacher"

  const totalLeads = Object.values(data.leads_by_status).reduce((a, b) => a + b, 0)
  const conversion = totalLeads ? Math.round((data.leads_by_status.enrolled / totalLeads) * 100) : 0
  const maxLead = Math.max(1, ...Object.values(data.leads_by_status))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Bosh sahifa</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Faol o'quvchilar" value={String(data.active_students)} />
        <StatCard label="Faol guruhlar" value={String(data.active_groups)} />
        {showMoney && (
          <>
            <StatCard label="Shu oydagi tushum" value={money(data.month_revenue)} />
            <StatCard
              label="Umumiy qarz"
              value={money(data.total_debt)}
              hint={`${data.debtors_count} ta qarzdor`}
              danger
            />
          </>
        )}
      </div>

      {showMoney && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>So'nggi 14 kunlik tushum</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.revenue_by_day}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} tickFormatter={shortMoney} />
                    <Tooltip formatter={(v) => money(Number(v))} labelFormatter={(l) => `${l}`} />
                    <Bar dataKey="amount" name="Tushum" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Lidlar voronkasi</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Jami {totalLeads} ta lid · yozilganlar {conversion}%
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {leadStages.map((s) => {
                  const count = data.leads_by_status[s.value]
                  return (
                    <div key={s.value} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{s.label}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${(count / maxLead) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                <Link to="/leads" className="inline-block pt-1 text-sm text-primary hover:underline">
                  Lidlarga o'tish
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Eng katta qarzdorlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.top_debtors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Qarzdorlar yo'q</p>
                ) : (
                  data.top_debtors.map((d) => (
                    <div key={d.student_id} className="flex justify-between border-b pb-2 text-sm last:border-0">
                      <span>{d.student_name}</span>
                      <span className="font-medium text-destructive">{money(d.debt)}</span>
                    </div>
                  ))
                )}
                <Link to="/payments" className="inline-block pt-1 text-sm text-primary hover:underline">
                  Barcha qarzdorlar
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}