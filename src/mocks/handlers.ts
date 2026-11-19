import { http, HttpResponse, delay } from "msw"

type Role = "ceo" | "admin" | "teacher"

const branches = [
  { id: 1, name: "Chilonzor filiali" },
  { id: 2, name: "Yunusobod filiali" },
]

const usersByPhone: Record<string, { id: number; first_name: string; last_name: string; role: Role }> = {
  "+998900000001": { id: 1, first_name: "Ali", last_name: "Karimov", role: "ceo" },
  "+998900000002": { id: 2, first_name: "Vali", last_name: "Rahimov", role: "admin" },
  "+998900000003": { id: 3, first_name: "Sardor", last_name: "Aliyev", role: "teacher" },
}

/* ---------- O'quvchilar ---------- */

const firstNames = ["Aziz", "Dilnoza", "Jasur", "Madina", "Sherzod", "Nilufar", "Bekzod", "Malika", "Otabek", "Zilola"]
const lastNames = ["Karimov", "Rahimova", "Aliyev", "Yusupova", "Tursunov", "Abdullayeva", "Qodirov", "Ergasheva"]
const statuses = ["active", "active", "active", "frozen", "left"] as const
const studentGroupLabels = ["Ingliz tili A1", "Matematika", "IELTS 6.5", "Rus tili"]

// 1-filialda 40 ta, 2-filialda 25 ta o'quvchi
const students = Array.from({ length: 65 }, (_, i) => ({
  id: i + 1,
  branch_id: i < 40 ? 1 : 2,
  first_name: firstNames[i % firstNames.length],
  last_name: lastNames[(i * 3) % lastNames.length],
  phone: `+99890${String(1000000 + i * 7919).slice(0, 7)}`,
  status: statuses[i % 5],
  balance: i % 4 === 0 ? -(((i % 5) + 1) * 150000) : (i % 3) * 100000,
  group: studentGroupLabels[i % 4],
}))

/* ---------- Kurslar va o'qituvchilar ---------- */

const coursesData = [
  { id: 1, name: "Ingliz tili A1", monthly_price: 400000 },
  { id: 2, name: "Ingliz tili B1", monthly_price: 500000 },
  { id: 3, name: "Matematika", monthly_price: 350000 },
  { id: 4, name: "IELTS 6.5", monthly_price: 700000 },
  { id: 5, name: "Rus tili", monthly_price: 400000 },
  { id: 6, name: "Dasturlash", monthly_price: 800000 },
]

const teachersData = [
  { id: 1, full_name: "Sardor Aliyev" },
  { id: 2, full_name: "Nodira Karimova" },
  { id: 3, full_name: "Jamshid Tursunov" },
  { id: 4, full_name: "Gulnora Yusupova" },
]

/* ---------- Guruhlar ---------- */

const schedules = [
  { weekdays: [0, 2, 4], start_time: "09:00", end_time: "10:30" },
  { weekdays: [1, 3, 5], start_time: "14:00", end_time: "15:30" },
  { weekdays: [0, 2, 4], start_time: "18:00", end_time: "19:30" },
]

// 1-filialda 11 ta, 2-filialda 7 ta guruh
const groupsData = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  branch_id: i < 11 ? 1 : 2,
  name: `Guruh ${101 + i}`,
  course_name: coursesData[i % coursesData.length].name,
  teacher_name: teachersData[i % teachersData.length].full_name,
  ...schedules[i % 3],
  students_count: 0, // o'qiganda hisoblanadi (withCount)
  monthly_price: [400000, 500000, 600000][i % 3],
  status: (["active", "active", "recruiting", "finished"] as const)[i % 4],
}))

type MockGroup = (typeof groupsData)[number]

// guruh a'zoligi: qaysi o'quvchi qaysi guruhda
type Membership = { group_id: number; student_id: number; discount_percent: number; joined_at: string }

const memberships: Membership[] = groupsData.flatMap((g) =>
  students
    .filter((s) => s.branch_id === g.branch_id && (s.id + g.id) % 5 === 0)
    .map((s) => ({
      group_id: g.id,
      student_id: s.id,
      discount_percent: (s.id % 3) * 5,
      joined_at: "2026-09-01",
    }))
)

const withCount = (g: MockGroup) => ({
  ...g,
  students_count: memberships.filter((m) => m.group_id === g.id).length,
})

function studentsOfGroup(groupId: number) {
  return memberships
    .filter((m) => m.group_id === groupId)
    .flatMap((m) => {
      const s = students.find((x) => x.id === m.student_id)
      return s ? [s] : []
    })
}

/* ---------- Darslar va davomat ---------- */

const today = new Date()
today.setHours(0, 0, 0, 0)

type MockLesson = {
  id: number
  date: string
  start_time: string
  end_time: string
  topic: string | null
  status: "planned" | "done"
}

// jadval kunlari: 0 = Dushanba ... 6 = Yakshanba
const mapWeekday = (d: Date) => (d.getDay() + 6) % 7

// dars id si: guruh id + sana (masalan 1 + 20261119 -> 120261119)
function lessonsFor(group: MockGroup, month: string): MockLesson[] {
  const [y, m] = month.split("-").map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const out: MockLesson[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(y, m - 1, day)
    if (!group.weekdays.includes(mapWeekday(d))) continue
    const date = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    out.push({
      id: Number(`${group.id}${date.replaceAll("-", "")}`),
      date,
      start_time: group.start_time,
      end_time: group.end_time,
      topic: null,
      status: d < today ? "done" : "planned",
    })
  }
  return out
}

// saqlangan davomat: dars id -> { o'quvchi id: holat }
const attendanceStore = new Map<string, Record<number, string>>()

/* ---------- To'lovlar ---------- */

type MockPayment = {
  id: number
  branch_id: number
  student_id: number
  amount: number
  method: "cash" | "card" | "transfer"
  note: string | null
  paid_at: string
  received_by: string
}

const paymentMethods = ["cash", "card", "transfer"] as const
const receivers = ["Vali Rahimov", "Ali Karimov"]

// boshlang'ich to'lovlar: so'nggi ~60 kun ichida, eng yangisi birinchi
const paymentsData: MockPayment[] = Array.from({ length: 36 }, (_, i) => {
  const student = students[(i * 5) % students.length]
  const paidAt = new Date(today)
  paidAt.setDate(paidAt.getDate() - i * 2)
  paidAt.setHours(9 + (i % 9), (i * 13) % 60)
  return {
    id: 36 - i,
    branch_id: student.branch_id,
    student_id: student.id,
    amount: [300000, 350000, 400000, 500000, 700000][i % 5],
    method: paymentMethods[i % 3],
    note: i % 6 === 0 ? "Oylik to'lov" : null,
    paid_at: paidAt.toISOString(),
    received_by: receivers[i % 2],
  }
})

const fullName = (s: (typeof students)[number]) => `${s.last_name} ${s.first_name}`

type LeadStatus = "new" | "contacted" | "trial" | "enrolled" | "lost"

type MockLead = {
  id: number
  branch_id: number
  full_name: string
  phone: string
  course_name: string | null
  source: string
  note: string | null
  status: LeadStatus
  created_at: string
}

const leadStatuses: LeadStatus[] = ["new", "new", "contacted", "contacted", "trial", "enrolled", "lost"]
const leadSourcesMock = ["Instagram", "Telegram", "Tanish-bilish", "Sayt"]

const leadsData: MockLead[] = Array.from({ length: 16 }, (_, i) => ({
  id: i + 1,
  branch_id: i < 11 ? 1 : 2,
  full_name: `${firstNames[(i * 3) % firstNames.length]} ${lastNames[(i * 5) % lastNames.length]}`,
  phone: `+99893${String(2000000 + i * 6151).slice(0, 7)}`,
  course_name: i % 4 === 3 ? null : coursesData[i % coursesData.length].name,
  source: leadSourcesMock[i % leadSourcesMock.length],
  note: i % 5 === 0 ? "Kechqurun qo'ng'iroq qilish" : null,
  status: leadStatuses[i % leadStatuses.length],
  created_at: new Date(today.getTime() - i * 86400000).toISOString(),
}))

const leadView = ({ branch_id: _branch, ...lead }: MockLead) => lead

/* ---------- Sozlamalar: xodimlar ---------- */

type MockStaff = {
  id: number
  branch_id: number
  first_name: string
  last_name: string
  phone: string
  role: "admin" | "teacher"
}

const staffData: MockStaff[] = [
  { id: 1, branch_id: 1, first_name: "Vali", last_name: "Rahimov", phone: "+998900000002", role: "admin" },
  { id: 2, branch_id: 1, first_name: "Sardor", last_name: "Aliyev", phone: "+998900000003", role: "teacher" },
  { id: 3, branch_id: 1, first_name: "Nodira", last_name: "Karimova", phone: "+998901112233", role: "teacher" },
  { id: 4, branch_id: 2, first_name: "Jamshid", last_name: "Tursunov", phone: "+998902223344", role: "teacher" },
  { id: 5, branch_id: 2, first_name: "Gulnora", last_name: "Yusupova", phone: "+998903334455", role: "admin" },
]

const staffView = ({ branch_id: _branch, ...s }: MockStaff) => s

/* ---------- Moliya: xarajatlar ---------- */

type ExpenseCategory = "rent" | "salary" | "utilities" | "marketing" | "other"

type MockExpense = {
  id: number
  branch_id: number
  category: ExpenseCategory
  amount: number
  note: string | null
  date: string // YYYY-MM-DD
}

const expenseCategoryList: ExpenseCategory[] = ["rent", "salary", "utilities", "marketing", "other"]
const expenseAmounts: Record<ExpenseCategory, number> = {
  rent: 6000000,
  salary: 4500000,
  utilities: 800000,
  marketing: 1200000,
  other: 300000,
}

const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

const monthKey = (d: Date) => isoDate(d).slice(0, 7)

// so'nggi ~3 oy ichida 18 ta xarajat
const expensesData: MockExpense[] = Array.from({ length: 18 }, (_, i) => {
  const d = new Date(today)
  d.setDate(d.getDate() - i * 5)
  const category = expenseCategoryList[i % 5]
  return {
    id: i + 1,
    branch_id: i % 3 === 2 ? 2 : 1,
    category,
    amount: expenseAmounts[category],
    note: i % 4 === 0 ? "Oylik to'lov" : null,
    date: isoDate(d),
  }
})

const uzMonths = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"]

/* ---------- Imtihonlar ---------- */

type MockExam = {
  id: number
  branch_id: number
  group_id: number
  title: string
  date: string // YYYY-MM-DD
  max_score: number
}

const examTitles = ["Oraliq nazorat", "Yakuniy imtihon", "Unit testi", "Oylik test"]

// 9 ta imtihon: birinchisi kelajakda, qolganlari o'tgan
const examsData: MockExam[] = Array.from({ length: 9 }, (_, i) => {
  const group = groupsData[(i * 2) % groupsData.length]
  const d = new Date(today)
  d.setDate(d.getDate() - i * 6 + 3)
  return {
    id: i + 1,
    branch_id: group.branch_id,
    group_id: group.id,
    title: examTitles[i % examTitles.length],
    date: d.toLocaleDateString("sv-SE"),
    max_score: 100,
  }
})

// saqlangan ballar: imtihon id -> { o'quvchi id: ball }
const examScores = new Map<number, Record<number, number>>()

// 2..7-imtihonlar uchun tayyor ballar, qolganlari hali baholanmagan
examsData
  .filter((e) => e.id >= 2 && e.id <= 7)
  .forEach((e) => {
    const record: Record<number, number> = {}
    for (const s of studentsOfGroup(e.group_id)) record[s.id] = 40 + ((s.id * 37 + e.id * 11) % 61)
    examScores.set(e.id, record)
  })

function examView(e: MockExam) {
  const group = groupsData.find((g) => g.id === e.group_id)
  const scores = Object.values(examScores.get(e.id) ?? {})
  return {
    id: e.id,
    group_id: e.group_id,
    group_name: group?.name ?? "",
    title: e.title,
    date: e.date,
    max_score: e.max_score,
    students_count: studentsOfGroup(e.group_id).length,
    graded_count: scores.length,
    average: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null,
  }
}

/* ---------- Yordamchilar ---------- */

function userFromRequest(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? ""
  return usersByPhone[token.replace("mock.", "")]
}

const unauthorized = () => HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })
const branchOf = (request: Request) => Number(request.headers.get("X-Branch-Id") ?? 0)
const searchOf = (request: Request) => (new URL(request.url).searchParams.get("search") ?? "").toLowerCase()

function paginate<T>(request: Request, items: T[]) {
  const url = new URL(request.url)
  const page = Number(url.searchParams.get("page") ?? 1)
  const pageSize = Number(url.searchParams.get("page_size") ?? 10)
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    page_size: pageSize,
  }
}

/* ---------- Handlerlar ---------- */

export const handlers = [
  // Auth
  http.post("*/api/v1/auth/login", async ({ request }) => {
    const { phone, password } = (await request.json()) as { phone: string; password: string }
    await delay(400)
    if (!usersByPhone[phone] || password.length < 4) {
      return HttpResponse.json({ detail: "Telefon yoki parol noto'g'ri" }, { status: 401 })
    }
    return HttpResponse.json({ access_token: `mock.${phone}`, refresh_token: `mock.${phone}` })
  }),

  http.post("*/api/v1/auth/refresh", async ({ request }) => {
    const { refresh_token } = (await request.json()) as { refresh_token: string }
    return HttpResponse.json({ access_token: refresh_token, refresh_token })
  }),

  http.get("*/api/v1/auth/me", ({ request }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()
    return HttpResponse.json({ ...user, branches: user.role === "ceo" ? branches : [branches[0]] })
  }),

  // O'quvchilar
  http.get("*/api/v1/students", async ({ request }) => {
    if (!userFromRequest(request)) return unauthorized()
    const search = searchOf(request)
    const branchId = branchOf(request)
    const filtered = students.filter(
      (s) =>
        s.branch_id === branchId && `${s.first_name} ${s.last_name} ${s.phone}`.toLowerCase().includes(search)
    )
    await delay(300)
    return HttpResponse.json(paginate(request, filtered))
  }),

  http.post("*/api/v1/students", async ({ request }) => {
    if (!userFromRequest(request)) return unauthorized()
    const body = (await request.json()) as {
      first_name: string
      last_name: string
      phone: string
      parent_name?: string
      parent_phone?: string
    }
    const student = {
      id: students.length + 1,
      branch_id: branchOf(request),
      ...body,
      status: "active" as const,
      balance: 0,
      group: "",
    }
    students.unshift(student)
    await delay(300)
    return HttpResponse.json(student, { status: 201 })
  }),

  // To'lovlar
  http.get("*/api/v1/payments", async ({ request }) => {
    if (!userFromRequest(request)) return unauthorized()
    const search = searchOf(request)
    const method = new URL(request.url).searchParams.get("method") ?? ""
    const branchId = branchOf(request)
    const filtered = paymentsData
      .filter((p) => p.branch_id === branchId && (!method || p.method === method))
      .flatMap((p) => {
        const s = students.find((x) => x.id === p.student_id)
        if (!s || !fullName(s).toLowerCase().includes(search)) return []
        return [{ ...p, student_name: fullName(s) }]
      })
    const page = paginate(request, filtered)
    await delay(300)
    return HttpResponse.json({ ...page, total_amount: filtered.reduce((sum, p) => sum + p.amount, 0) })
  }),

  http.post("*/api/v1/payments", async ({ request }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()
    if (user.role === "teacher") return HttpResponse.json({ detail: "Ruxsat yo'q" }, { status: 403 })
    const body = (await request.json()) as {
      student_id: number
      amount: number
      method: MockPayment["method"]
      note?: string
    }
    const student = students.find((s) => s.id === body.student_id && s.branch_id === branchOf(request))
    if (!student) return HttpResponse.json({ detail: "O'quvchi topilmadi" }, { status: 404 })
    if (!Number.isInteger(body.amount) || body.amount <= 0) {
      return HttpResponse.json({ detail: "Summa noto'g'ri" }, { status: 400 })
    }
    const payment: MockPayment = {
      id: Math.max(0, ...paymentsData.map((p) => p.id)) + 1,
      branch_id: student.branch_id,
      student_id: student.id,
      amount: body.amount,
      method: body.method,
      note: body.note ?? null,
      paid_at: new Date().toISOString(),
      received_by: `${user.first_name} ${user.last_name}`,
    }
    paymentsData.unshift(payment)
    student.balance += body.amount // to'lov balansni oshiradi
    await delay(300)
    return HttpResponse.json({ ...payment, student_name: fullName(student) }, { status: 201 })
  }),

  // Qarzdorlar: balansi manfiy o'quvchilar, qarzi katta bo'lgani birinchi
  http.get("*/api/v1/debtors", async ({ request }) => {
    if (!userFromRequest(request)) return unauthorized()
    const search = searchOf(request)
    const branchId = branchOf(request)
    const all = students.filter((s) => s.branch_id === branchId && s.balance < 0)
    const filtered = all
      .filter((s) => `${fullName(s)} ${s.phone}`.toLowerCase().includes(search))
      .sort((a, b) => a.balance - b.balance)
      .map((s) => ({
        student_id: s.id,
        student_name: fullName(s),
        phone: s.phone,
        group: s.group,
        debt: -s.balance,
      }))
    const page = paginate(request, filtered)
    await delay(300)
    return HttpResponse.json({ ...page, total_debt: all.reduce((sum, s) => sum - s.balance, 0) })
  }),

    // Lidlar
  http.get("*/api/v1/leads", async ({ request }) => {
    if (!userFromRequest(request)) return unauthorized()
    const branchId = branchOf(request)
    await delay(300)
    return HttpResponse.json(leadsData.filter((l) => l.branch_id === branchId).map(leadView))
  }),

  http.post("*/api/v1/leads", async ({ request }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()
    if (user.role === "teacher") return HttpResponse.json({ detail: "Ruxsat yo'q" }, { status: 403 })
    const body = (await request.json()) as {
      full_name: string
      phone: string
      course_id?: number
      source: string
      note?: string
    }
    const lead: MockLead = {
      id: Math.max(0, ...leadsData.map((l) => l.id)) + 1,
      branch_id: branchOf(request),
      full_name: body.full_name,
      phone: body.phone,
      course_name: coursesData.find((c) => c.id === body.course_id)?.name ?? null,
      source: body.source,
      note: body.note ?? null,
      status: "new",
      created_at: new Date().toISOString(),
    }
    leadsData.unshift(lead)
    await delay(300)
    return HttpResponse.json(leadView(lead), { status: 201 })
  }),

  http.patch("*/api/v1/leads/:id", async ({ request, params }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()
    if (user.role === "teacher") return HttpResponse.json({ detail: "Ruxsat yo'q" }, { status: 403 })
    const lead = leadsData.find((l) => l.id === Number(params.id) && l.branch_id === branchOf(request))
    if (!lead) return HttpResponse.json({ detail: "Lid topilmadi" }, { status: 404 })
    const { status } = (await request.json()) as { status: LeadStatus }
    lead.status = status
    await delay(200)
    return HttpResponse.json(leadView(lead))
  }),

    // Dashboard
  http.get("*/api/v1/dashboard", async ({ request }) => {
    if (!userFromRequest(request)) return unauthorized()
    const branchId = branchOf(request)

    const branchStudents = students.filter((s) => s.branch_id === branchId)
    const branchPayments = paymentsData.filter((p) => p.branch_id === branchId)
    const debtors = branchStudents.filter((s) => s.balance < 0)

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const sum = (list: MockPayment[]) => list.reduce((acc, p) => acc + p.amount, 0)

    // so'nggi 14 kun, har kun uchun tushum
    const revenueByDay = Array.from({ length: 14 }, (_, i) => {
      const from = new Date(today)
      from.setDate(from.getDate() - (13 - i))
      const to = new Date(from)
      to.setDate(to.getDate() + 1)
      const dayPayments = branchPayments.filter((p) => {
        const t = new Date(p.paid_at)
        return t >= from && t < to
      })
      const label = `${String(from.getDate()).padStart(2, "0")}.${String(from.getMonth() + 1).padStart(2, "0")}`
      return { date: label, amount: sum(dayPayments) }
    })

    const leadsByStatus: Record<LeadStatus, number> = { new: 0, contacted: 0, trial: 0, enrolled: 0, lost: 0 }
    for (const l of leadsData) if (l.branch_id === branchId) leadsByStatus[l.status]++

    await delay(300)
    return HttpResponse.json({
      active_students: branchStudents.filter((s) => s.status === "active").length,
      active_groups: groupsData.filter((g) => g.branch_id === branchId && g.status === "active").length,
      month_revenue: sum(branchPayments.filter((p) => new Date(p.paid_at) >= monthStart)),
      total_debt: debtors.reduce((acc, s) => acc - s.balance, 0),
      debtors_count: debtors.length,
      revenue_by_day: revenueByDay,
      leads_by_status: leadsByStatus,
      top_debtors: [...debtors]
        .sort((a, b) => a.balance - b.balance)
        .slice(0, 5)
        .map((s) => ({ student_id: s.id, student_name: `${s.last_name} ${s.first_name}`, debt: -s.balance })),
    })
  }),

    // Sozlamalar (faqat CEO)
  http.get("*/api/v1/branches", async ({ request }) => {
    if (!userFromRequest(request)) return unauthorized()
    await delay(200)
    return HttpResponse.json(branches)
  }),

  http.post("*/api/v1/branches", async ({ request }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()
    if (user.role !== "ceo") return HttpResponse.json({ detail: "Ruxsat yo'q" }, { status: 403 })
    const { name } = (await request.json()) as { name: string }
    if (branches.some((b) => b.name.toLowerCase() === name.trim().toLowerCase())) {
      return HttpResponse.json({ detail: "Bunday filial allaqachon bor" }, { status: 400 })
    }
    const branch = { id: Math.max(...branches.map((b) => b.id)) + 1, name: name.trim() }
    branches.push(branch)
    await delay(300)
    return HttpResponse.json(branch, { status: 201 })
  }),

  http.post("*/api/v1/courses", async ({ request }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()
    if (user.role !== "ceo") return HttpResponse.json({ detail: "Ruxsat yo'q" }, { status: 403 })
    const body = (await request.json()) as { name: string; monthly_price: number }
    if (coursesData.some((c) => c.name.toLowerCase() === body.name.trim().toLowerCase())) {
      return HttpResponse.json({ detail: "Bunday kurs allaqachon bor" }, { status: 400 })
    }
    const course = {
      id: Math.max(...coursesData.map((c) => c.id)) + 1,
      name: body.name.trim(),
      monthly_price: body.monthly_price,
    }
    coursesData.push(course)
    await delay(300)
    return HttpResponse.json(course, { status: 201 })
  }),

  http.get("*/api/v1/staff", async ({ request }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()
    if (user.role !== "ceo") return HttpResponse.json({ detail: "Ruxsat yo'q" }, { status: 403 })
    const branchId = branchOf(request)
    await delay(300)
    return HttpResponse.json(staffData.filter((s) => s.branch_id === branchId).map(staffView))
  }),

  http.post("*/api/v1/staff", async ({ request }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()
    if (user.role !== "ceo") return HttpResponse.json({ detail: "Ruxsat yo'q" }, { status: 403 })
    const body = (await request.json()) as {
      first_name: string
      last_name: string
      phone: string
      role: "admin" | "teacher"
    }
    if (staffData.some((s) => s.phone === body.phone) || usersByPhone[body.phone]) {
      return HttpResponse.json({ detail: "Bu telefon raqam band" }, { status: 400 })
    }
    const staff: MockStaff = {
      id: Math.max(...staffData.map((s) => s.id)) + 1,
      branch_id: branchOf(request),
      ...body,
    }
    staffData.push(staff)
    // o'qituvchi guruh yaratish formasidagi ro'yxatga ham tushadi
    if (staff.role === "teacher") {
      teachersData.push({
        id: Math.max(...teachersData.map((t) => t.id)) + 1,
        full_name: `${staff.first_name} ${staff.last_name}`,
      })
    }
    await delay(300)
    return HttpResponse.json(staffView(staff), { status: 201 })
  }),

    // Moliya (faqat CEO)
  http.get("*/api/v1/finance/summary", async ({ request }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()
    if (user.role !== "ceo") return HttpResponse.json({ detail: "Ruxsat yo'q" }, { status: 403 })
    const branchId = branchOf(request)
    const sum = (list: { amount: number }[]) => list.reduce((acc, x) => acc + x.amount, 0)

    // so'nggi 3 oy: ikki oy oldin, o'tgan oy, shu oy
    const byMonth = [2, 1, 0].map((back) => {
      const m = new Date(today.getFullYear(), today.getMonth() - back, 1)
      const key = monthKey(m)
      const income = sum(paymentsData.filter((p) => p.branch_id === branchId && monthKey(new Date(p.paid_at)) === key))
      const expense = sum(expensesData.filter((e) => e.branch_id === branchId && e.date.startsWith(key)))
      return { month: key, label: uzMonths[m.getMonth()], income, expense }
    })
    const current = byMonth[2]

    const currentKey = monthKey(today)
    const expenseByCategory = expenseCategoryList
      .map((category) => ({
        category,
        amount: sum(
          expensesData.filter(
            (e) => e.branch_id === branchId && e.category === category && e.date.startsWith(currentKey)
          )
        ),
      }))
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)

    await delay(300)
    return HttpResponse.json({
      month_income: current.income,
      month_expense: current.expense,
      month_profit: current.income - current.expense,
      by_month: byMonth,
      expense_by_category: expenseByCategory,
    })
  }),

  http.get("*/api/v1/expenses", async ({ request }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()
    if (user.role !== "ceo") return HttpResponse.json({ detail: "Ruxsat yo'q" }, { status: 403 })
    const category = new URL(request.url).searchParams.get("category") ?? ""
    const branchId = branchOf(request)
    const filtered = expensesData
      .filter((e) => e.branch_id === branchId && (!category || e.category === category))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
      .map(({ branch_id: _branch, ...e }) => e)
    await delay(300)
    return HttpResponse.json({
      ...paginate(request, filtered),
      total_amount: filtered.reduce((acc, e) => acc + e.amount, 0),
    })
  }),

  http.post("*/api/v1/expenses", async ({ request }) => {
    const user = userFromRequest(request)
    if (!user) return unauthorized()
    if (user.role !== "ceo") return HttpResponse.json({ detail: "Ruxsat yo'q" }, { status: 403 })
    const body = (await request.json()) as {
      category: ExpenseCategory
      amount: number
      note?: string
      date: string
    }
    if (!Number.isInteger(body.amount) || body.amount <= 0) {
      return HttpResponse.json({ detail: "Summa noto'g'ri" }, { status: 400 })
    }
    const expense: MockExpense = {
      id: Math.max(0, ...expensesData.map((e) => e.id)) + 1,
      branch_id: branchOf(request),
      category: body.category,
      amount: body.amount,
      note: body.note ?? null,
      date: body.date,
    }
    expensesData.unshift(expense)
    await delay(300)
    const { branch_id: _branch, ...view } = expense
    return HttpResponse.json(view, { status: 201 })
  }),

    // Imtihonlar
  http.get("*/api/v1/exams", async ({ request }) => {
    if (!userFromRequest(request)) return unauthorized()
    const search = searchOf(request)
    const branchId = branchOf(request)
    const filtered = examsData
      .filter((e) => e.branch_id === branchId)
      .map(examView)
      .filter((e) => `${e.title} ${e.group_name}`.toLowerCase().includes(search))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    await delay(300)
    return HttpResponse.json(paginate(request, filtered))
  }),

  http.post("*/api/v1/exams", async ({ request }) => {
    if (!userFromRequest(request)) return unauthorized()
    const body = (await request.json()) as { group_id: number; title: string; date: string; max_score: number }
    const group = groupsData.find((g) => g.id === body.group_id && g.branch_id === branchOf(request))
    if (!group) return HttpResponse.json({ detail: "Guruh topilmadi" }, { status: 404 })
    if (!Number.isInteger(body.max_score) || body.max_score <= 0) {
      return HttpResponse.json({ detail: "Eng yuqori ball noto'g'ri" }, { status: 400 })
    }
    const exam: MockExam = {
      id: Math.max(0, ...examsData.map((e) => e.id)) + 1,
      branch_id: group.branch_id,
      group_id: group.id,
      title: body.title,
      date: body.date,
      max_score: body.max_score,
    }
    examsData.unshift(exam)
    await delay(300)
    return HttpResponse.json(examView(exam), { status: 201 })
  }),

  http.get("*/api/v1/exams/:id", async ({ request, params }) => {
    if (!userFromRequest(request)) return unauthorized()
    const exam = examsData.find((e) => e.id === Number(params.id) && e.branch_id === branchOf(request))
    if (!exam) return HttpResponse.json({ detail: "Imtihon topilmadi" }, { status: 404 })
    const saved = examScores.get(exam.id) ?? {}
    await delay(300)
    return HttpResponse.json({
      ...examView(exam),
      grades: studentsOfGroup(exam.group_id).map((s) => ({
        student_id: s.id,
        student_name: `${s.last_name} ${s.first_name}`,
        score: saved[s.id] ?? null,
      })),
    })
  }),

  http.post("*/api/v1/exams/:id/grades", async ({ request, params }) => {
    if (!userFromRequest(request)) return unauthorized()
    const exam = examsData.find((e) => e.id === Number(params.id) && e.branch_id === branchOf(request))
    if (!exam) return HttpResponse.json({ detail: "Imtihon topilmadi" }, { status: 404 })
    const grades = (await request.json()) as { student_id: number; score: number }[]
    if (grades.some((g) => !Number.isInteger(g.score) || g.score < 0 || g.score > exam.max_score)) {
      return HttpResponse.json({ detail: `Ball 0 dan ${exam.max_score} gacha bo'lishi kerak` }, { status: 400 })
    }
    const saved = examScores.get(exam.id) ?? {}
    for (const g of grades) saved[g.student_id] = g.score
    examScores.set(exam.id, saved)
    await delay(300)
    return HttpResponse.json({ saved: grades.length })
  }),

  // Kurslar va o'qituvchilar (selectlar uchun)
  http.get("*/api/v1/courses", async ({ request }) => {
    if (!userFromRequest(request)) return unauthorized()
    await delay(200)
    return HttpResponse.json(coursesData)
  }),

  http.get("*/api/v1/teachers", async ({ request }) => {
    if (!userFromRequest(request)) return unauthorized()
    await delay(200)
    return HttpResponse.json(teachersData)
  }),

  // Guruhlar
  http.get("*/api/v1/groups", async ({ request }) => {
    if (!userFromRequest(request)) return unauthorized()
    const search = searchOf(request)
    const branchId = branchOf(request)
    const filtered = groupsData
      .filter(
        (g) =>
          g.branch_id === branchId &&
          `${g.name} ${g.course_name} ${g.teacher_name}`.toLowerCase().includes(search)
      )
      .map(withCount)
    await delay(300)
    return HttpResponse.json(paginate(request, filtered))
  }),

  http.post("*/api/v1/groups", async ({ request }) => {
    if (!userFromRequest(request)) return unauthorized()
    const body = (await request.json()) as {
      name: string
      course_id: number
      teacher_id: number
      weekdays: number[]
      start_time: string
      end_time: string
      start_date: string
      monthly_price: number
    }
    const course = coursesData.find((c) => c.id === body.course_id)
    const teacher = teachersData.find((t) => t.id === body.teacher_id)
    if (!course || !teacher) {
      return HttpResponse.json({ detail: "Kurs yoki o'qituvchi topilmadi" }, { status: 400 })
    }
    const group: MockGroup = {
      id: Math.max(...groupsData.map((g) => g.id)) + 1,
      branch_id: branchOf(request),
      name: body.name,
      course_name: course.name,
      teacher_name: teacher.full_name,
      weekdays: body.weekdays,
      start_time: body.start_time,
      end_time: body.end_time,
      students_count: 0,
      monthly_price: body.monthly_price,
      status: "recruiting",
    }
    groupsData.unshift(group)
    await delay(300)
    return HttpResponse.json(withCount(group), { status: 201 })
  }),

  http.get("*/api/v1/groups/:id", async ({ request, params }) => {
    if (!userFromRequest(request)) return unauthorized()
    const group = groupsData.find((g) => g.id === Number(params.id))
    if (!group) return HttpResponse.json({ detail: "Guruh topilmadi" }, { status: 404 })
    await delay(300)
    return HttpResponse.json(withCount(group))
  }),

  // Guruh o'quvchilari
  http.get("*/api/v1/groups/:id/students", async ({ request, params }) => {
    if (!userFromRequest(request)) return unauthorized()
    const groupId = Number(params.id)
    const items = memberships
      .filter((m) => m.group_id === groupId)
      .flatMap((m) => {
        const s = students.find((x) => x.id === m.student_id)
        return s
          ? [
              {
                student_id: s.id,
                first_name: s.first_name,
                last_name: s.last_name,
                phone: s.phone,
                discount_percent: m.discount_percent,
                joined_at: m.joined_at,
                status: s.status,
              },
            ]
          : []
      })
    await delay(300)
    return HttpResponse.json(items)
  }),

  http.post("*/api/v1/groups/:id/students", async ({ request, params }) => {
    if (!userFromRequest(request)) return unauthorized()
    const groupId = Number(params.id)
    const { student_id, discount_percent } = (await request.json()) as {
      student_id: number
      discount_percent: number
    }
    if (memberships.some((m) => m.group_id === groupId && m.student_id === student_id)) {
      return HttpResponse.json({ detail: "O'quvchi allaqachon shu guruhda" }, { status: 400 })
    }
    memberships.push({
      group_id: groupId,
      student_id,
      discount_percent,
      joined_at: new Date().toISOString().slice(0, 10),
    })
    await delay(300)
    return HttpResponse.json({ ok: true }, { status: 201 })
  }),

  http.delete("*/api/v1/groups/:id/students/:studentId", async ({ request, params }) => {
    if (!userFromRequest(request)) return unauthorized()
    const index = memberships.findIndex(
      (m) => m.group_id === Number(params.id) && m.student_id === Number(params.studentId)
    )
    if (index === -1) return HttpResponse.json({ detail: "O'quvchi guruhda topilmadi" }, { status: 404 })
    memberships.splice(index, 1)
    await delay(300)
    return new HttpResponse(null, { status: 204 })
  }),

  // Darslar va davomat
  http.get("*/api/v1/groups/:id/lessons", async ({ request, params }) => {
    if (!userFromRequest(request)) return unauthorized()
    const group = groupsData.find((g) => g.id === Number(params.id))
    if (!group) return HttpResponse.json({ detail: "Guruh topilmadi" }, { status: 404 })
    const now = new Date()
    const fallback = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const month = new URL(request.url).searchParams.get("month") ?? fallback
    await delay(300)
    return HttpResponse.json(lessonsFor(group, month))
  }),

  http.get("*/api/v1/lessons/:id", async ({ request, params }) => {
    if (!userFromRequest(request)) return unauthorized()
    const idStr = String(params.id)
    const groupId = Number(idStr.slice(0, -8))
    const d = idStr.slice(-8)
    const date = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`
    const group = groupsData.find((g) => g.id === groupId)
    if (!group) return HttpResponse.json({ detail: "Dars topilmadi" }, { status: 404 })
    const saved = attendanceStore.get(idStr) ?? {}
    await delay(300)
    return HttpResponse.json({
      id: Number(idStr),
      date,
      start_time: group.start_time,
      end_time: group.end_time,
      topic: null,
      status: "planned",
      records: studentsOfGroup(groupId).map((s) => ({
        student_id: s.id,
        student_name: `${s.last_name} ${s.first_name}`,
        status: saved[s.id] ?? null,
      })),
    })
  }),

  http.post("*/api/v1/lessons/:id/attendance", async ({ request, params }) => {
    if (!userFromRequest(request)) return unauthorized()
    const records = (await request.json()) as { student_id: number; status: string }[]
    const key = String(params.id)
    const saved = attendanceStore.get(key) ?? {}
    for (const r of records) saved[r.student_id] = r.status
    attendanceStore.set(key, saved)
    await delay(300)
    return HttpResponse.json({ saved: records.length })
  }),
]