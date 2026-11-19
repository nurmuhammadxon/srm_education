import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/DataTable"
import { useAuth, type Branch } from "@/stores/auth"
import { useCourses, type Course } from "@/features/references/api"
import { useBranches, useStaff, type Staff } from "./api"
import { BranchFormDialog, CourseFormDialog, StaffFormDialog } from "./SettingsDialogs"

const money = (n: number) => `${new Intl.NumberFormat("uz-UZ").format(n)} so'm`

const courseColumns: ColumnDef<Course>[] = [
  { accessorKey: "name", header: "Kurs nomi" },
  { accessorKey: "monthly_price", header: "Oylik narxi", cell: ({ getValue }) => money(getValue<number>()) },
]

const staffColumns: ColumnDef<Staff>[] = [
  { id: "fullName", header: "F.I.Sh.", accessorFn: (r) => `${r.last_name} ${r.first_name}` },
  { accessorKey: "phone", header: "Telefon" },
  {
    accessorKey: "role",
    header: "Lavozimi",
    cell: ({ getValue }) =>
      getValue<Staff["role"]>() === "admin" ? (
        <Badge>Admin</Badge>
      ) : (
        <Badge variant="secondary">O'qituvchi</Badge>
      ),
  },
]

export default function SettingsPage() {
  const branchId = useAuth((s) => s.branchId)
  const courses = useCourses()
  const staff = useStaff()
  const branches = useBranches()

  const branchColumns: ColumnDef<Branch>[] = [
    { accessorKey: "name", header: "Filial nomi" },
    {
      id: "current",
      header: "",
      cell: ({ row }) => (row.original.id === branchId ? <Badge variant="outline">Hozir tanlangan</Badge> : null),
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Sozlamalar</h1>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Kurslar</TabsTrigger>
          <TabsTrigger value="staff">Xodimlar</TabsTrigger>
          <TabsTrigger value="branches">Filiallar</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <CourseFormDialog />
          </div>
          <DataTable
            columns={courseColumns}
            data={courses.data}
            isLoading={courses.isLoading}
            isError={courses.isError}
            emptyText="Kurslar yo'q"
          />
        </TabsContent>

        <TabsContent value="staff" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Tanlangan filial xodimlari</p>
            <StaffFormDialog />
          </div>
          <DataTable
            columns={staffColumns}
            data={staff.data}
            isLoading={staff.isLoading}
            isError={staff.isError}
            emptyText="Xodimlar yo'q"
          />
        </TabsContent>

        <TabsContent value="branches" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <BranchFormDialog />
          </div>
          <DataTable
            columns={branchColumns}
            data={branches.data}
            isLoading={branches.isLoading}
            isError={branches.isError}
            emptyText="Filiallar yo'q"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}