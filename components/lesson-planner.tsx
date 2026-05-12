"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  History,
  Lightbulb,
  Loader2,
  PenLine,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import type { LessonPlanResult } from "@/lib/types";

type SavedPlan = {
  id: string;
  topic: string;
  grade_level: string;
  duration: string;
  created_at: string;
  content: LessonPlanResult;
};

export function LessonPlanner() {
  const [topic, setTopic] = useState("Frações");
  const [gradeLevel, setGradeLevel] = useState("7º ano");
  const [teachingGoal, setTeachingGoal] = useState(
    "Trabalhar operações com frações e identificar erros comuns da turma.",
  );
  const [duration, setDuration] = useState("50 minutos");
  const [plan, setPlan] = useState<LessonPlanResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<SavedPlan[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    const res = await fetch("/api/planner");
    if (res.ok) {
      const data = (await res.json()) as { plans: SavedPlan[] };
      setHistory(data.plans);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      setIsLoading(true);
      setMessage(null);
      try {
        const response = await fetch("/api/planner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, gradeLevel, teachingGoal, duration }),
        });
        const payload = (await response.json()) as { message?: string; plan?: LessonPlanResult };
        if (!response.ok) throw new Error(payload.message || "Não foi possível gerar o plano.");
        setPlan(payload.plan ?? null);
        setMessage(payload.message || "Plano gerado e salvo.");
        fetchHistory();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Falha ao gerar plano de aula.");
      } finally {
        setIsLoading(false);
      }
    });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/planner?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((p) => p.id !== id));
        setPendingDeleteId(null);
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="card-shadow rounded-xl border border-border bg-white/90 p-6 backdrop-blur sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Planejamento com IA</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Planejador de aulas</h1>
        <p className="mt-2 max-w-xl text-sm leading-7 text-muted">
          Informe o tema e o objetivo da aula para gerar uma estrutura prática com objetivos,
          atividades, exercícios e avaliação.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">Tema da aula</span>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Frações, Verbos, Revolução Industrial..."
                maxLength={200}
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-primary"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">Ano / Série</span>
              <input
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="Ex: 7º ano, 2º ano do Ensino Médio..."
                maxLength={100}
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-primary"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Objetivo pedagógico</span>
            <textarea
              rows={4}
              value={teachingGoal}
              onChange={(e) => setTeachingGoal(e.target.value)}
              placeholder="Descreva o que você quer que os alunos aprendam ou pratiquem..."
              maxLength={1000}
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
            />
          </label>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex-1 space-y-1.5">
              <span className="text-sm font-medium text-foreground">Duração estimada</span>
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ex: 50 minutos, 2 aulas de 45 min..."
                maxLength={50}
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-primary"
              />
            </label>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isLoading ? "Gerando..." : "Gerar plano"}
            </button>
          </div>
        </form>

        {message ? (
          <p className="mt-5 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground">
            {message}
          </p>
        ) : null}
      </section>

      {history.length > 0 && (
        <section className="card-shadow rounded-xl border border-border bg-white/90 p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <History className="h-4 w-4 text-primary" />
            </span>
            <h2 className="text-base font-bold text-foreground">Planos salvos</h2>
          </div>
          <ul className="space-y-2">
            {history.map((saved) => (
              <li key={saved.id}>
                {pendingDeleteId === saved.id ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-rose-50 px-4 py-3">
                    <p className="text-sm text-danger font-medium">Excluir este plano?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(null)}
                        className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(saved.id)}
                        disabled={deletingId === saved.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {deletingId === saved.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        Excluir
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => setPlan(saved.content)}
                      className="flex-1 text-left"
                    >
                      <span className="text-sm font-medium text-foreground">{saved.topic}</span>
                      <span className="ml-2 text-xs text-muted">
                        {saved.grade_level} · {saved.duration} ·{" "}
                        {new Date(saved.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(saved.id)}
                      className="shrink-0 rounded-md p-1.5 text-muted hover:bg-rose-50 hover:text-danger"
                      title="Mover para lixeira"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {plan ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <PlannerCard title="Objetivos" items={plan.objectives} icon={<Target className="h-5 w-5" />} colorClass="bg-amber-100 text-amber-700" />
          <PlannerCard title="Atividades" items={plan.activities} icon={<ClipboardList className="h-5 w-5" />} colorClass="bg-emerald-100 text-emerald-700" />
          <PlannerCard title="Exercícios" items={plan.exercises} icon={<PenLine className="h-5 w-5" />} colorClass="bg-violet-100 text-violet-700" />
          <PlannerCard title="Avaliação" items={plan.evaluation} icon={<GraduationCap className="h-5 w-5" />} colorClass="bg-rose-100 text-rose-700" />
          <div className="lg:col-span-2">
            <PlannerCard title="Dicas pedagógicas" items={plan.teachingTips} icon={<Lightbulb className="h-5 w-5" />} colorClass="bg-sky-100 text-sky-700" />
          </div>
        </section>
      ) : (
        <div className="card-shadow rounded-xl border border-border bg-white/90 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">Nenhum plano gerado ainda</p>
          <p className="mt-1 text-sm text-muted">Preencha o formulário acima e clique em gerar.</p>
        </div>
      )}
    </div>
  );
}

function PlannerCard({ title, items, icon, colorClass }: { title: string; items: string[]; icon: React.ReactNode; colorClass: string }) {
  return (
    <article className="card-shadow rounded-xl border border-border bg-white/90 p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
          {icon}
        </span>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 rounded-lg border border-border bg-surface p-3 text-sm leading-6 text-muted">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-surface-strong text-xs font-bold text-foreground">
              {i + 1}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
