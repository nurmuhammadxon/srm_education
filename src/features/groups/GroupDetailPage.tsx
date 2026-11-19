import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGroup } from "./api"
import { formatSchedule, groupStatusMap } from "./utils"
import { GroupStudentsTab } from "./GroupStudentsTab"
import { AttendanceTab } from "./AttendanceTab"

export default function GroupDetailPage() {
  const { id } = useParams()
  const groupId = Number(id)
  const { data: group, isLoading, isError } = useGroup(groupId)

  if (isLoading) return <p className="text-muted-foreground">Yuklanmoqda...</p>

  if (isError || !group) {
    return (
      <div className="space-y-3">
        <p className="text-destructive">Guruh topilmadi</p>
        <Link to="/groups" className="text-sm text-primary hover:underline">
          Guruhlarga qaytish
        </Link>
      </div>
    )
  }

  const status = groupStatusMap[group.status]

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/groups"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Guruhlar
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{group.name}</h1>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {group.course_name} · {group.teacher_name} · {formatSchedule(group)}
        </p>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">O'quvchilar</TabsTrigger>
          <TabsTrigger value="attendance">Davomat</TabsTrigger>
        </TabsList>
        <TabsContent value="students" className="mt-4">
          <GroupStudentsTab groupId={groupId} />
        </TabsContent>
        <TabsContent value="attendance" className="mt-4">
          <AttendanceTab groupId={groupId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}