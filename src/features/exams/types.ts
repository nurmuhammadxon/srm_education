export interface Exam {
  id: number
  group_id: number
  group_name: string
  title: string
  date: string // YYYY-MM-DD
  max_score: number
  students_count: number
  graded_count: number
  average: number | null
}

export interface ExamGrade {
  student_id: number
  student_name: string
  score: number | null
}

export interface ExamDetail extends Exam {
  grades: ExamGrade[]
}

export interface NewExam {
  group_id: number
  title: string
  date: string
  max_score: number
}

export interface GradeInput {
  student_id: number
  score: number
}