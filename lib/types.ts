export type AssignmentStatus =
  | "uploaded"
  | "processing"
  | "review_pending"
  | "approved"
  | "rejected"
  | "failed";

export type CorrectionStatus = "pending_review" | "approved" | "rejected" | "failed";

export type SourceType = "text" | "pdf" | "image";

export type AssignmentRecord = {
  id: string;
  teacher_id: string;
  title: string;
  class_name: string;
  student_name: string;
  source_type: SourceType;
  grade_scale: 10 | 100;
  file_path: string | null;
  input_text: string | null;
  extracted_text: string | null;
  status: AssignmentStatus;
  processing_error: string | null;
  created_at: string;
  updated_at: string;
};

export type CorrectionRecord = {
  id: string;
  assignment_id: string;
  teacher_id: string;
  suggested_grade: number | null;
  final_grade: number | null;
  feedback: string | null;
  final_feedback: string | null;
  weaknesses: string[];
  summary: string | null;
  status: CorrectionStatus;
  raw_response: Record<string, unknown> | null;
  review_notes: string | null;
  approved_at: string | null;
  ai_provider: string | null;
  created_at: string;
  updated_at: string;
};

export type CorrectionWithAssignment = CorrectionRecord & {
  assignments: Pick<
    AssignmentRecord,
    | "id"
    | "title"
    | "class_name"
    | "student_name"
    | "grade_scale"
    | "status"
    | "created_at"
  >;
};

export type ReportSummary = {
  averageGrade: number;
  totalApproved: number;
  commonMistakes: Array<{ label: string; count: number }>;
  studentsNeedingSupport: Array<{ studentName: string; finalGrade: number; className: string }>;
};

export type DashboardSummary = {
  pendingReviewCount: number;
  averageGrade: number;
  studentsNeedingSupportCount: number;
};

export type DashboardActivityItem = {
  id: string;
  studentName: string;
  className: string;
  assignmentTitle: string;
  status: CorrectionStatus;
  finalGrade: number | null;
  updatedAt: string;
};

export type DashboardData = {
  summary: DashboardSummary;
  recentActivity: DashboardActivityItem[];
};

export type ReportPeriod = "7d" | "30d" | "90d" | "all";

export type ReportFilters = {
  className: string | null;
  period: ReportPeriod;
};

export type TeacherReport = ReportSummary & {
  availableClassNames: string[];
  appliedFilters: ReportFilters;
};

export type CalendarEventType = "aula" | "prova" | "ferias" | "recuperacao" | "reuniao" | "outro";

export type CalendarEvent = {
  id: string;
  teacher_id: string;
  title: string;
  start_date: string;
  end_date: string;
  type: CalendarEventType;
  turma: string | null;
  description: string | null;
  deleted_at: string | null;
  created_at: string;
};

export type LessonPlanResult = {
  topic: string;
  gradeLevel: string;
  objectives: string[];
  activities: string[];
  exercises: string[];
  evaluation: string[];
  teachingTips: string[];
};