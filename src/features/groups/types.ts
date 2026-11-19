export interface Group {
  id: number
  name: string
  course_name: string
  teacher_name: string
  weekdays: number[] 
  start_time: string 
  end_time: string
  students_count: number
  monthly_price: number
  status: "recruiting" | "active" | "finished"
}

export interface GroupStudent {
  student_id: number
  first_name: string
  last_name: string
  phone: string
  discount_percent: number
  joined_at: string
  status: "active" | "frozen" | "left"
}

export interface Lesson {
  id: number
  date: string 
  start_time: string
  end_time: string
  topic: string | null
  status: "planned" | "done" | "cancelled" | "holiday"
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused"

export interface AttendanceRecord {
  student_id: number
  student_name: string
  status: AttendanceStatus | null 
}

export interface LessonDetail extends Lesson {
  records: AttendanceRecord[]
}

export interface AttendanceInput {
  student_id: number
  status: AttendanceStatus
}

export interface NewGroup {
  name: string
  course_id: number
  teacher_id: number
  weekdays: number[]
  start_time: string
  end_time: string
  start_date: string
  monthly_price: number
}