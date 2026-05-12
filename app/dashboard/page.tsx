import { redirect } from "next/navigation";
import { AlertTriangle, BookOpen, CheckCircle2, Clock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SetupPanel } from "@/components/setup-panel";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/login/actions";
import { hasSupabaseAdminEnv, hasSupabasePublicEnv } from "@/lib/env";
import { getTeacherDashboardData } from "@/lib/server/data";

export default async function DashboardPage() {
  if (!hasSupabasePublicEnv() || !hasSupabaseAdminEnv()) {
    return (
      <SetupPanel
        title="Ative o painel com as chaves do Supabase"
        description="O dashboard já está conectado à camada de dados, mas o ambiente local ainda não tem as variáveis necessárias para autenticar e ler os resumos do professor."
      />
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dashboard = await getTeacherDashboardData(user.id);
  const firstName = user.email?.split("@")[0] ?? "professor";

  return (
    <AppShell userEmail={user.email ?? "professor@escola.com"} onLogout={signOutAction}>
      <main className="space-y-5">
        <section className="card-shadow rounded-xl border border-border bg-white/90 p-6 backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Painel do professor</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Bom trabalho, {firstName}.
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-7 text-muted">
                Comece enviando atividades, acompanhe a fila de correções e revise cada resultado antes de aprovar para a turma.
              </p>
            </div>
            <div className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <BookOpen className="mb-1 h-5 w-5 text-amber-600" />
              <p className="font-medium">Professor no controle</p>
              <p className="text-amber-700">Nada é finalizado sem sua aprovação.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Aguardando revisão" value={String(dashboard.summary.pendingReviewCount)} helper="Correções geradas pela IA" icon={<Clock className="h-5 w-5" />} colorClass="bg-amber-50 text-amber-600 border-amber-200" valueClass="text-amber-700" />
          <StatCard label="Média aprovada" value={String(dashboard.summary.averageGrade).replace(".", ",")} helper="Baseado nas tarefas aprovadas" icon={<CheckCircle2 className="h-5 w-5" />} colorClass="bg-emerald-50 text-emerald-600 border-emerald-200" valueClass="text-emerald-700" />
          <StatCard label="Alunos com dificuldade" value={String(dashboard.summary.studentsNeedingSupportCount)} helper="Detectados nos relatórios recentes" icon={<AlertTriangle className="h-5 w-5" />} colorClass="bg-rose-50 text-rose-600 border-rose-200" valueClass="text-rose-700" />
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="card-shadow rounded-xl border border-border bg-white/90 p-6">
            <h2 className="text-lg font-bold text-foreground">Próximos passos</h2>
            <p className="mt-1 text-sm text-muted">Siga o fluxo para avançar no ciclo de correção.</p>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-muted">
              <li className="flex gap-3 rounded-lg border border-border bg-surface p-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">1</span>
                <span><strong className="text-foreground">Enviar atividade</strong> em PDF, imagem ou texto para iniciar a correção em lote.</span>
              </li>
              <li className="flex gap-3 rounded-lg border border-border bg-surface p-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">2</span>
                <span><strong className="text-foreground">Revisar correções</strong> — editar nota, ajustar feedback e aprovar manualmente.</span>
              </li>
              <li className="flex gap-3 rounded-lg border border-border bg-surface p-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">3</span>
                <span><strong className="text-foreground">Gerar relatório</strong> e criar um plano de aula focado nas lacunas detectadas.</span>
              </li>
            </ul>
          </article>

          <article className="card-shadow rounded-xl border border-white/10 bg-emerald-950 p-6 text-white">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-emerald-400">Atividade recente</p>
            <h2 className="mt-3 text-xl font-bold">Últimas movimentações</h2>
            <div className="mt-4 space-y-3">
              {dashboard.recentActivity.length === 0 ? (
                <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-slate-400">
                  As últimas correções aprovadas, rejeitadas ou pendentes aparecerão aqui assim que o fluxo começar.
                </p>
              ) : (
                dashboard.recentActivity.map((item) => (
                  <div key={item.id} className="rounded-lg border border-white/8 bg-white/5 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{item.studentName}</p>
                        <p className="mt-1 text-sm text-slate-400">{item.className} · {item.assignmentTitle}</p>
                        <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle(item.status)}`}>
                          {formatStatus(item.status)}
                        </span>
                      </div>
                      <div className="shrink-0 text-right text-sm text-slate-400">
                        {item.finalGrade !== null ? <p className="font-medium text-white">{String(item.finalGrade).replace(".", ",")}</p> : null}
                        <p className="text-xs">{formatDate(item.updatedAt)}</p>
                      </div>
                    </div>
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

function StatCard({ label, value, helper, icon, colorClass, valueClass }: { label: string; value: string; helper: string; icon: React.ReactNode; colorClass: string; valueClass: string }) {
  return (
    <article className={`card-shadow rounded-xl border bg-white/90 p-6 backdrop-blur ${colorClass}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className={`rounded-lg p-2 ${colorClass}`}>{icon}</span>
      </div>
      <strong className={`mt-4 block text-4xl font-bold ${valueClass}`}>{value}</strong>
      <p className="mt-2 text-sm text-muted">{helper}</p>
    </article>
  );
}

function statusStyle(status: "pending_review" | "approved" | "rejected" | "failed") {
  if (status === "approved") return "bg-emerald-500/20 text-emerald-300";
  if (status === "rejected") return "bg-rose-500/20 text-rose-300";
  if (status === "failed") return "bg-red-500/20 text-red-300";
  return "bg-amber-500/20 text-amber-300";
}

function formatStatus(status: "pending_review" | "approved" | "rejected" | "failed") {
  if (status === "pending_review") return "Aguardando revisão";
  if (status === "approved") return "Aprovada";
  if (status === "rejected") return "Rejeitada";
  return "Falhou";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
