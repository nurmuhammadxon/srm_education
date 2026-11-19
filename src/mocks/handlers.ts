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