import { redirect } from "next/navigation";
import { AlertTriangle, BarChart3, CheckCircle2, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SetupPanel } from "@/components/setup-panel";
import { signOutAction } from "@/app/login/actions";
import { hasSupabaseAdminEnv, hasSupabasePublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getTeacherReport, parseReportFilters } from "@/lib/server/data";

type ReportsPageProps = {
  searchParams: Promise<{
    className?: string | string[];
    period?: string | string[];
  }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  if (!hasSupabasePublicEnv() || !hasSupabaseAdminEnv()) {
    return (
      <SetupPanel
        title="Configure o Supabase para liberar os relatórios"
        description="Os filtros por turma e período já estão implementados, mas a leitura dos dados depende das credenciais locais do Supabase."
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const report = await getTeacherReport(
    user.id,
    parseReportFilters({
      className: Array.isArray(params.className) ? params.className[0] : params.className,
      period: Array.isArray(params.period) ? params.period[0] : params.period,
    }),
  );

  return (
    <AppShell userEmail={user.email ?? "professor@escola.com"} onLogout={signOutAction}>
      <main className="space-y-5">
        {/* Header */}
        <section className="card-shadow rounded-[2rem] border border-border bg-white/90 p-6 backdrop-blur sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">
            Análise consolidada
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            Relatório da turma
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-muted">
            Acompanhe o desempenho médio, padrões de erro e os estudantes que precisam de maior
            atenção.
          </p>
        </section>

        {/* Filters */}
        <section className="card-shadow rounded-[2rem] border border-border bg-white/90 p-6">
          <form method="get" className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">Turma</span>
              <select
                name="className"
                defaultValue={report.appliedFilters.className ?? ""}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="">Todas as turmas</option>
                {report.availableClassNames.map((cn) => (
                  <option key={cn} value={cn}>
                    {cn}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">Período</span>
              <select
                name="period"
                defaultValue={report.appliedFilters.period}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="all">Todo o histórico</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
              </select>
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-strong"
              >
                Aplicar filtros
              </button>
              <a
                href="/reports"
                className="inline-flex items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-muted hover:border-foreground hover:text-foreground"
              >
                Limpar
              </a>
            </div>
          </form>
        </section>

        {/* Summary stats */}
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Média geral"
            value={String(report.averageGrade)}
            helper="Normalizada de 0 a 10"
            icon={<TrendingUp className="h-5 w-5" />}
            colorClass="bg-emerald-50 text-emerald-600 border-emerald-200"
            valueClass="text-emerald-700"
          />
          <StatCard
            label="Correções aprovadas"
            value={String(report.totalApproved)}
            helper="Itens validados pelo professor"
            icon={<CheckCircle2 className="h-5 w-5" />}
            colorClass="bg-amber-50 text-amber-600 border-amber-200"
            valueClass="text-amber-700"
          />
          <StatCard
            label="Erros recorrentes"
            value={String(report.commonMistakes.length)}
            helper="Tópicos com maior incidência"
            icon={<BarChart3 className="h-5 w-5" />}
            colorClass="bg-violet-50 text-violet-600 border-violet-200"
            valueClass="text-violet-700"
          />
        </section>

        {/* Details */}
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="card-shadow rounded-[2rem] border border-border bg-white/90 p-6">
            <h2 className="text-lg font-bold text-foreground">Erros mais frequentes</h2>
            <p className="mt-1 text-sm text-muted">
              Tópicos em que a turma apresenta maior dificuldade.
            </p>
            <div className="mt-5 space-y-3">
              {report.commonMistakes.length === 0 ? (
                <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
                  Os erros comuns aparecerão aqui depois das primeiras aprovações.
                </p>
              ) : (
                report.commonMistakes.map((mistake, index) => (
                  <div
                    key={mistake.label}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                        {index + 1}
                      </span>
                      <p className="text-sm font-medium text-foreground">{mistake.label}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm text-amber-800">
                      {mistake.count}×
                    </span>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="card-shadow rounded-[2rem] border border-border bg-white/90 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Alunos com dificuldade</h2>
                <p className="mt-1 text-sm text-muted">Notas abaixo de 6,0 no período.</p>
              </div>
              <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-rose-500" />
            </div>
            <div className="mt-5 space-y-3">
              {report.studentsNeedingSupport.length === 0 ? (
                <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
                  Nenhum aluno abaixo da média identificado até o momento.
                </p>
              ) : (
                report.studentsNeedingSupport.map((student) => (
                  <div
                    key={`${student.studentName}-${student.className}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{student.studentName}</p>
                      <p className="mt-0.5 text-xs text-muted">{student.className}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-rose-200 bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-800">
                      {String(student.finalGrade).replace(".", ",")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </main>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  helper,
  icon,
  colorClass,
  valueClass,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  colorClass: string;
  valueClass: string;
}) {
  return (
    <article className={`card-shadow rounded-[1.75rem] border bg-white/90 p-6 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className={`rounded-xl p-2 ${colorClass}`}>{icon}</span>
      </div>
      <strong className={`mt-4 block text-4xl font-bold ${valueClass}`}>{value}</strong>
      <p className="mt-2 text-sm text-muted">{helper}</p>
    </article>
  );
}
