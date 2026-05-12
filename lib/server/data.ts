import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CorrectionWithAssignment,
  DashboardData,
  DashboardSummary,
  ReportFilters,
  ReportPeriod,
  TeacherReport,
} from "@/lib/types";

export async function getTeacherCorrections(teacherId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("corrections")
    .select(
      "id, assignment_id, teacher_id, suggested_grade, final_grade, feedback, final_feedback, weaknesses, summary, status, raw_response, review_notes, approved_at, ai_provider, created_at, updated_at, assignments!inner(id, title, class_name, student_name, grade_scale, status, created_at)",
    )
    .eq("teacher_id", teacherId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => ({
    ...item,
    assignments: Array.isArray(item.assignments) ? item.assignments[0] : item.assignments,
  })) as CorrectionWithAssignment[];
}

function normalizeGrade(grade: number, scale: number) {
  return scale === 100 ? grade / 10 : grade;
}

function buildDashboardSummary(corrections: CorrectionWithAssignment[]): DashboardSummary {
  const approved = corrections.filter(
    (item) => item.status === "approved" && typeof item.final_grade === "number",
  );

  const totalGrade = approved.reduce((sum, item) => {
    return sum + normalizeGrade(item.final_grade ?? 0, item.assignments.grade_scale);
  }, 0);

  const studentsNeedingSupportCount = approved.filter((item) => {
    return normalizeGrade(item.final_grade ?? 0, item.assignments.grade_scale) < 6;
  }).length;

  return {
    pendingReviewCount: corrections.filter((item) => item.status === "pending_review").length,
    averageGrade: approved.length ? Number((totalGrade / approved.length).toFixed(1)) : 0,
    studentsNeedingSupportCount,
  };
}

function getPeriodStart(period: ReportPeriod) {
  if (period === "all") {
    return null;
  }

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function filterCorrectionsByReport(corrections: CorrectionWithAssignment[], filters: ReportFilters) {
  const periodStart = getPeriodStart(filters.period);

  return corrections.filter((item) => {
    if (filters.className && item.assignments.class_name !== filters.className) {
      return false;
    }

    if (periodStart === null) {
      return true;
    }

    const referenceDate = item.approved_at ?? item.updated_at ?? item.created_at;
    return new Date(referenceDate).getTime() >= periodStart;
  });
}

export function parseReportFilters(input: {
  className?: string | null;
  period?: string | null;
}): ReportFilters {
  const className = input.className?.trim() ? input.className.trim() : null;
  const period = input.period === "7d" || input.period === "30d" || input.period === "90d"
    ? input.period
    : "all";

  return {
    className,
    period,
  };
}

export async function getTeacherDashboardSummary(teacherId: string): Promise<DashboardSummary> {
  const corrections = await getTeacherCorrections(teacherId);
  return buildDashboardSummary(corrections);
}

export async function getTeacherDashboardData(teacherId: string): Promise<DashboardData> {
  const corrections = await getTeacherCorrections(teacherId);
  const summary = buildDashboardSummary(corrections);

  const recentActivity = [...corrections]
    .sort((left, right) => {
      return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
    })
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      studentName: item.assignments.student_name,
      className: item.assignments.class_name,
      assignmentTitle: item.assignments.title,
      status: item.status,
      finalGrade:
        typeof item.final_grade === "number"
          ? Number(normalizeGrade(item.final_grade, item.assignments.grade_scale).toFixed(1))
          : null,
      updatedAt: item.updated_at,
    }));

  return {
    summary,
    recentActivity,
  };
}

export async function getTeacherReport(
  teacherId: string,
  filters: ReportFilters = { className: null, period: "all" },
): Promise<TeacherReport> {
  const corrections = await getTeacherCorrections(teacherId);
  const filteredCorrections = filterCorrectionsByReport(corrections, filters);
  const approved = corrections.filter(
    (item) => item.status === "approved" && typeof item.final_grade === "number",
  );

  const filteredApproved = filteredCorrections.filter(
    (item) => item.status === "approved" && typeof item.final_grade === "number",
  );

  const totalGrade = filteredApproved.reduce((sum, item) => {
    return sum + normalizeGrade(item.final_grade ?? 0, item.assignments.grade_scale);
  }, 0);

  const weaknessMap = new Map<string, number>();
  filteredApproved.forEach((item) => {
    item.weaknesses.forEach((weakness) => {
      weaknessMap.set(weakness, (weaknessMap.get(weakness) ?? 0) + 1);
    });
  });

  const studentsNeedingSupport = filteredApproved
    .map((item) => ({
      studentName: item.assignments.student_name,
      finalGrade: item.final_grade ?? 0,
      className: item.assignments.class_name,
      normalizedGrade: normalizeGrade(item.final_grade ?? 0, item.assignments.grade_scale),
    }))
    .filter((item) => item.normalizedGrade < 6)
    .sort((left, right) => left.normalizedGrade - right.normalizedGrade)
    .slice(0, 6)
    .map(({ normalizedGrade, ...rest }) => ({
      ...rest,
      finalGrade: Number(normalizedGrade.toFixed(1)),
    }));

  const availableClassNames = [...new Set(approved.map((item) => item.assignments.class_name))].sort((left, right) =>
    left.localeCompare(right, "pt-BR"),
  );

  return {
    averageGrade: filteredApproved.length ? Number((totalGrade / filteredApproved.length).toFixed(1)) : 0,
    totalApproved: filteredApproved.length,
    commonMistakes: [...weaknessMap.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5),
    studentsNeedingSupport,
    availableClassNames,
    appliedFilters: filters,
  };
}