"use client";

import { startTransition, useMemo, useState } from "react";
import { CheckCircle2, Loader2, RotateCcw, Save, Trash2 } from "lucide-react";
import type { CorrectionWithAssignment } from "@/lib/types";

type StatusFilter = "all" | "pending_review" | "approved" | "rejected";

type CorrectionsReviewListProps = {
  initialCorrections: CorrectionWithAssignment[];
};

export function CorrectionsReviewList({ initialCorrections }: CorrectionsReviewListProps) {
  const [corrections, setCorrections] = useState(initialCorrections);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (statusFilter === "all" ? corrections : corrections.filter((c) => c.status === statusFilter)),
    [corrections, statusFilter],
  );

  function updateLocalState(id: string, updates: Partial<CorrectionWithAssignment>) {
    setCorrections((current) => current.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }

  async function submitReview(correction: CorrectionWithAssignment, status: "pending_review" | "approved" | "rejected") {
    startTransition(async () => {
      setBusyId(correction.id);
      setMessage(null);
      try {
        const response = await fetch("/api/corrections/review", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            correctionId: correction.id,
            assignmentId: correction.assignment_id,
            status,
            finalGrade: correction.final_grade ?? correction.suggested_grade,
            finalFeedback: correction.final_feedback ?? correction.feedback,
            reviewNotes: correction.review_notes,
          }),
        });
        const payload = (await response.json()) as { message?: string };
        if (!response.ok) throw new Error(payload.message || "Não foi possível atualizar a revisão.");
        updateLocalState(correction.id, { status });
        setMessage(payload.message || "Revisão salva.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Falha ao atualizar revisão.");
      } finally {
        setBusyId(null);
      }
    });
  }

  async function handleDelete(correctionId: string) {
    setDeletingId(correctionId);
    try {
      const res = await fetch(`/api/corrections?id=${correctionId}`, { method: "DELETE" });
      if (res.ok) {
        setCorrections((prev) => prev.filter((c) => c.id !== correctionId));
        setPendingDeleteId(null);
      }
    } finally {
      setDeletingId(null);
    }
  }

  const counts = useMemo(
    () => ({
      all: corrections.length,
      pending_review: corrections.filter((c) => c.status === "pending_review").length,
      approved: corrections.filter((c) => c.status === "approved").length,
      rejected: corrections.filter((c) => c.status === "rejected").length,
    }),
    [corrections],
  );

  return (
    <div className="space-y-5">
      <section className="card-shadow rounded-xl border border-border bg-white/90 p-6 backdrop-blur sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Revisão manual</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Aprovar correções</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
          Edite nota e feedback quando necessário. Nenhum resultado é finalizado sem sua decisão explícita.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {(
            [
              { key: "all", label: "Todas" },
              { key: "pending_review", label: "Pendentes" },
              { key: "approved", label: "Aprovadas" },
              { key: "rejected", label: "Rejeitadas" },
            ] as { key: StatusFilter; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === key
                  ? "bg-primary text-white"
                  : "border border-border bg-white text-muted hover:border-primary hover:text-primary"
              }`}
            >
              {label}{" "}
              <span className={`ml-1 rounded-md px-1.5 py-0.5 text-xs font-bold ${statusFilter === key ? "bg-white/20 text-white" : "bg-surface-strong text-foreground"}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {message ? (
          <p className="mt-5 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground">
            {message}
          </p>
        ) : null}
      </section>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="card-shadow rounded-xl border border-border bg-white/90 px-6 py-10 text-center">
            <p className="text-sm text-muted">
              {corrections.length === 0
                ? "Ainda não há correções. Envie atividades para começar."
                : "Nenhuma correção corresponde ao filtro selecionado."}
            </p>
          </div>
        ) : (
          filtered.map((correction) => {
            const disabled = busyId === correction.id;
            const isPendingDelete = pendingDeleteId === correction.id;

            return (
              <article key={correction.id} className="card-shadow rounded-xl border border-border bg-white/90 p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-base font-bold text-foreground">{correction.assignments.student_name}</p>
                    <p className="mt-1 text-sm text-muted">
                      {correction.assignments.class_name} · {correction.assignments.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={correction.status} />
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(isPendingDelete ? null : correction.id)}
                      className="rounded-md p-1.5 text-muted hover:bg-rose-50 hover:text-danger"
                      title="Mover para lixeira"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {isPendingDelete && (
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-rose-50 px-4 py-3">
                    <p className="text-sm font-medium text-danger">Excluir esta correção e atividade?</p>
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
                        onClick={() => handleDelete(correction.id)}
                        disabled={deletingId === correction.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {deletingId === correction.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        Excluir
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
                  <span className="text-sm text-amber-700">
                    Nota sugerida pela IA: <strong className="text-amber-900">{correction.suggested_grade}</strong>
                  </span>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[0.3fr_0.7fr]">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">Nota final</span>
                    <input
                      type="number"
                      min={0}
                      max={correction.assignments.grade_scale}
                      step="0.1"
                      value={correction.final_grade ?? correction.suggested_grade ?? 0}
                      onChange={(e) => updateLocalState(correction.id, { final_grade: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">Feedback final</span>
                    <textarea
                      rows={4}
                      value={correction.final_feedback ?? correction.feedback ?? ""}
                      onChange={(e) => updateLocalState(correction.id, { final_feedback: e.target.value })}
                      className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[0.65fr_0.35fr]">
                  <div className="rounded-lg border border-border bg-surface-strong px-4 py-4">
                    <p className="text-sm font-medium text-foreground">Pontos de atenção</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {correction.weaknesses.length > 0 ? (
                        correction.weaknesses.map((w) => (
                          <span key={w} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-sm text-amber-800">
                            {w}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-muted">Nenhum ponto fraco registrado.</span>
                      )}
                    </div>
                  </div>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">Observações</span>
                    <textarea
                      rows={4}
                      value={correction.review_notes ?? ""}
                      onChange={(e) => updateLocalState(correction.id, { review_notes: e.target.value })}
                      placeholder="Anotações internas do professor..."
                      className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </label>
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => submitReview(correction, "approved")}
                    disabled={disabled}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Aprovar
                  </button>
                  <button
                    type="button"
                    onClick={() => submitReview(correction, "rejected")}
                    disabled={disabled}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Rejeitar
                  </button>
                  <button
                    type="button"
                    onClick={() => submitReview(correction, "pending_review")}
                    disabled={disabled}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-semibold text-muted hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    Salvar rascunho
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending_review: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-rose-100 text-rose-800",
    failed: "bg-red-100 text-red-800",
  };
  const label: Record<string, string> = {
    pending_review: "Aguardando revisão",
    approved: "Aprovada",
    rejected: "Rejeitada",
    failed: "Falhou",
  };
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${map[status] ?? "bg-slate-100 text-slate-700"}`}>
      {label[status] ?? status}
    </span>
  );
}
