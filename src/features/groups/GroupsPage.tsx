import { useState } from "react";
import { Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useGroups } from "./api";
import { formatSchedule, groupStatusMap } from "./utils";
import type { Group } from "./types";
import { useAuth } from "@/stores/auth";
import { GroupFormDialog } from "./GroupFormDialog";

const PAGE_SIZE = 10;

const money = (n: number) => `${new Intl.NumberFormat("uz-UZ").format(n)} so'm`;

const columns: ColumnDef<Group>[] = [
  {
    accessorKey: "name",
    header: "Guruh",
    cell: ({ row, getValue }) => (
      <Link
        to={`/groups/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {getValue<string>()}
      </Link>
    ),
  },
  { accessorKey: "course_name", header: "Kurs" },
  { accessorKey: "teacher_name", header: "O'qituvchi" },
  { id: "schedule", header: "Jadval", accessorFn: (r) => formatSchedule(r) },
  { accessorKey: "students_count", header: "O'quvchilar" },
  {
    accessorKey: "monthly_price",
    header: "Oylik narx",
    cell: ({ getValue }) => money(getValue<number>()),
  },
  {
    accessorKey: "status",
    header: "Holati",
    cell: ({ getValue }) => {
      const s = groupStatusMap[getValue<Group["status"]>()];
      return <Badge variant={s.variant}>{s.label}</Badge>;
    },
  },
];

export default function GroupsPage() {
  const role = useAuth((s) => s.user?.role);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError, isFetching } = useGroups({
    page,
    page_size: PAGE_SIZE,
    search: debouncedSearch,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Guruhlar</h1>
        <div className="flex items-center gap-2">
          <Input
            className="w-64"
            placeholder="Guruh, kurs yoki o'qituvchi..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {role !== "teacher" && <GroupFormDialog />}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        isFetching={isFetching}
        emptyText="Guruhlar topilmadi"
      />
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}
