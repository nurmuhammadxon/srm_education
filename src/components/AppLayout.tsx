import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Layers,
  UserPlus,
  ClipboardCheck,
  Wallet,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react"
import { useAuth, type Role } from "@/stores/auth"
import { queryClient } from "@/lib/queryClient"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const nav: { to: string; label: string; icon: LucideIcon; roles: Role[] }[] = [
  { to: "/", label: "Bosh sahifa", icon: LayoutDashboard, roles: ["ceo", "admin", "teacher"] },
  { to: "/leads", label: "Lidlar", icon: UserPlus, roles: ["ceo", "admin"] },
  { to: "/groups", label: "Guruhlar", icon: Layers, roles: ["ceo", "admin", "teacher"] },
  { to: "/students", label: "O'quvchilar", icon: Users, roles: ["ceo", "admin", "teacher"] },
  { to: "/exams", label: "Imtihonlar", icon: ClipboardCheck, roles: ["ceo", "admin", "teacher"] },
  { to: "/finance", label: "Moliya", icon: Wallet, roles: ["ceo"] },
  { to: "/settings", label: "Sozlamalar", icon: Settings, roles: ["ceo"] },
]

const roleLabel: Record<Role, string> = { ceo: "CEO", admin: "Admin", teacher: "O'qituvchi" }

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  )

export default function AppLayout() {
  const navigate = useNavigate()
  const { user, branchId, setBranch, logout } = useAuth()
  if (!user) return <Navigate to="/login" replace />

  const items = nav.filter((n) => n.roles.includes(user.role))
  const initials = `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`
  const currentBranch = user.branches.find((b) => b.id === branchId)

  function handleLogout() {
    logout()
    queryClient.clear()
    navigate("/login", { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar (kompyuter) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-background md:flex">
        <div className="flex h-14 items-center border-b px-4 font-semibold">O'quv markaz CRM</div>
        <nav className="flex flex-col gap-1 p-3">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className={linkClass}>
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b bg-background px-4">
          {/* Filial tanlagich */}
          {user.branches.length > 1 ? (
            <Select
              value={String(branchId ?? "")}
              onValueChange={(v) => {
                if (v) setBranch(Number(v))
              }}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Filialni tanlang">{currentBranch?.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {user.branches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm font-medium">{user.branches[0]?.name}</span>
          )}

          {/* Foydalanuvchi menyusi */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">{user.first_name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-sm font-medium">
                {user.first_name} {user.last_name}
                <div className="text-xs font-normal text-muted-foreground">{roleLabel[user.role]}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="size-4" /> Chiqish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b bg-background p-2 md:hidden">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={(s) => cn(linkClass(s), "shrink-0")}
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}