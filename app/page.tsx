import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export default function Home() {
  return (
    <main className="soft-grid flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:px-10">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white/80 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Alívio do Professor</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">IA pedagógica</p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-strong"
          >
            Acessar painel
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        {/* Hero */}
        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
              <Sparkles className="h-4 w-4" />
              Plataforma em português para a educação básica brasileira
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
              Menos tempo{" "}
              <span className="text-primary">corrigindo</span>,{" "}
              <br className="hidden sm:block" />
              mais tempo{" "}
              <span className="text-primary">ensinando</span>.
            </h1>

            <p className="max-w-xl text-lg leading-8 text-muted">
              Envie atividades, receba correções sugeridas por IA, revise cada nota e acompanhe
              as dificuldades da turma — tudo em um fluxo pensado para o professor brasileiro.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white hover:bg-primary-strong"
              >
                Criar conta gratuita
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-6 py-3 text-base font-semibold text-foreground hover:border-primary hover:text-primary"
              >
                Ver painel de exemplo
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FeatureCard icon={<PencilLine className="h-5 w-5" />} title="Correção assistida" description="IA sugere nota e feedback. Você aprova." colorClass="bg-amber-100 text-amber-700" />
              <FeatureCard icon={<Users className="h-5 w-5" />} title="Visão da turma" description="Erros comuns e alunos que precisam de atenção." colorClass="bg-emerald-100 text-emerald-700" />
              <FeatureCard icon={<GraduationCap className="h-5 w-5" />} title="Plano de aula" description="Estrutura completa gerada em segundos com IA." colorClass="bg-violet-100 text-violet-700" />
            </div>
          </div>

          {/* How it works card */}
          <div className="card-shadow rounded-xl border border-white/80 bg-white/95 p-7 backdrop-blur">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Como funciona</p>
            <h2 className="mt-3 text-2xl font-bold text-foreground">Da tarefa ao feedback em 3 passos.</h2>

            <div className="mt-6 space-y-3">
              <StepCard number="1" title="Envie a atividade" description="PDF, foto ou texto — direto do celular ou computador." badgeClass="bg-amber-100 text-amber-800" />
              <StepCard number="2" title="IA analisa e corrige" description="Nota sugerida, feedback e pontos de dificuldade gerados automaticamente." badgeClass="bg-emerald-100 text-emerald-800" />
              <StepCard number="3" title="Você decide e finaliza" description="Edite, ajuste e aprove. Nada é publicado sem sua validação." badgeClass="bg-violet-100 text-violet-800" />
            </div>

            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <p className="text-sm leading-6 text-amber-800">
                  <strong>Professor no controle.</strong> A IA sugere — você tem sempre a palavra final antes de qualquer aprovação.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-6">
              <MiniStat icon={<ClipboardCheck className="h-4 w-4" />} label="Correção" />
              <MiniStat icon={<BookOpen className="h-4 w-4" />} label="Relatórios" />
              <MiniStat icon={<CheckCircle2 className="h-4 w-4" />} label="Aprovação" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description, colorClass }: { icon: React.ReactNode; title: string; description: string; colorClass: string }) {
  return (
    <div className="rounded-xl border border-border bg-white/80 p-5 backdrop-blur">
      <div className={`mb-4 inline-flex rounded-lg p-2.5 ${colorClass}`}>{icon}</div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description, badgeClass }: { number: string; title: string; description: string; badgeClass: string }) {
  return (
    <div className="flex gap-4 rounded-lg border border-border bg-surface p-4">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${badgeClass}`}>
        {number}
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-5 text-muted">{description}</p>
      </div>
    </div>
  );
}

function MiniStat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <span className="text-xs font-medium text-muted">{label}</span>
    </div>
  );
}
