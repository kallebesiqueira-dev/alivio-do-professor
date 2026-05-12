"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, ClipboardList, Loader2, RotateCcw, Trash2 } from "lucide-react";

type TrashedPlan = {
  id: string;
  topic: string;
  grade_level: string;
  duration: string;
  deleted_at: string;
};

type TrashedCorrection = {
  id: string;
  assignment_id: string;
  suggested_grade: number | null;
  deleted_at: string;
  assignments: { title: string; student_name: string; class_name: string };
};

export function TrashList() {
  const [plans, setPlans] = useState<TrashedPlan[]>([]);
  const [corrections, setCorrections] = useState<TrashedCorrection[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchTrash = useCallback(async () => {
    const res = await fetch("/api/trash");
    if (res.ok) {
      const data = (await res.json()) as { lessonPlans: TrashedPlan[]; corrections: TrashedCorrection[] };
      setPlans(data.lessonPlans);
      setCorrections(data.corrections);
    }
  }, []);

  useEffect(() => { fetchTrash(); }, [fetchTrash]);

  async function restore(id: string, type: "lesson_plan" | "correction") {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch("/api/trash", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type }),
      });
      const payload = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(payload.message);
      setMessage(payload.message ?? "Restaurado.");
      fetchTrash();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erro ao restaurar.");
    } finally {
      setBusyId(null);
    }
  }

  async function permanentDelete(id: string, type: "lesson_plan" | "correction") {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/trash?id=${id}&type=${type}`, { method: "DELETE" });
      const payload = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(payload.message);
      setMessage(payload.message ?? "Excluído permanentemente.");
      setConfirmDeleteId(null);
      fetchTrash();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erro ao excluir.");
    } finally {
      setBusyId(null);
    }
  }

  const isEmpty = plans.length === 0 && corrections.length === 0;

  return (
    <div className="space-y-5">
      <section className="card-shadow rounded-xl border border-border bg-white/90 p-6 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Lixeira</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Itens excluídos</h1>
        <p className="mt-2 max-w-xl text-sm leading-7 text-muted">
          Restaure itens para recuperá-los ou exclua definitivamente para liberar espaço.
        </p>
        {message && (
          <p className="mt-5 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground">
            {message}
          </p>
        )}
      </section>

      {isEmpty ? (
        <div className="card-shadow rounded-xl border border-border bg-white/90 p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-strong">
            <Trash2 className="h-5 w-5 text-muted" />
          </div>
          <p className="text-sm font-medium text-foreground">Lixeira vazia</p>
          <p className="mt-1 text-sm text-muted">Nenhum item foi movido para a lixeira ainda.</p>
        </div>
      ) : (
        <>
          {plans.length > 0 && (
            <section className="card-shadow rounded-xl border border-border bg-white/90 p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <BookOpen className="h-4 w-4" />
                </span>
                <h2 className="text-base font-bold text-foreground">Planos de aula</h2>
              </div>
              <ul className="space-y-2">
                {plans.map((plan) => (
                  <TrashItem
                    key={plan.id}
                    id={plan.id}
                    type="lesson_plan"
                    title={plan.topic}
                    subtitle={`${plan.grade_level} · ${plan.duration}`}
                    deletedAt={plan.deleted_at}
                    busyId={busyId}
                    confirmDeleteId={confirmDeleteId}
                    onRestore={restore}
                    onConfirmDelete={() => setConfirmDeleteId(plan.id)}
                    onCancelDelete={() => setConfirmDeleteId(null)}
                    onPermanentDelete={permanentDelete}
                  />
                ))}
              </ul>
            </section>
          )}

          {corrections.length > 0 && (
            <section className="card-shadow rounded-xl border border-border bg-white/90 p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <ClipboardList className="h-4 w-4" />
                </span>
                <h2 className="text-base font-bold text-foreground">Correções</h2>
              </div>
              <ul className="space-y-2">
                {corrections.map((correction) => (
                  <TrashItem
                    key={correction.id}
                    id={correction.id}
                    type="correction"
                    title={correction.assignments.student_name}
                    subtitle={`${correction.assignments.class_name} · ${correction.assignments.title}`}
                    deletedAt={correction.deleted_at}
                    busyId={busyId}
                    confirmDeleteId={confirmDeleteId}
                    onRestore={restore}
                    onConfirmDelete={() => setConfirmDeleteId(correction.id)}
                    onCancelDelete={() => setConfirmDeleteId(null)}
                    onPermanentDelete={permanentDelete}
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function TrashItem({
  id, type, title, subtitle, deletedAt, busyId, confirmDeleteId,
  onRestore, onConfirmDelete, onCancelDelete, onPermanentDelete,
}: {
  id: string;
  type: "lesson_plan" | "correction";
  title: string;
  subtitle: string;
  deletedAt: string;
  busyId: string | null;
  confirmDeleteId: string | null;
  onRestore: (id: string, type: "lesson_plan" | "correction") => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onPermanentDelete: (id: string, type: "lesson_plan" | "correction") => void;
}) {
  const busy = busyId === id;
  const confirming = confirmDeleteId === id;

  if (confirming) {
    return (
      <li className="flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-rose-50 px-4 py-3">
        <p className="text-sm font-medium text-danger">Excluir permanentemente?</p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancelDelete} className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onPermanentDelete(id, type)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Excluir
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted">
          {subtitle} · Excluído em {new Date(deletedAt).toLocaleDateString("pt-BR")}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => onRestore(id, type)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
          Restaurar
        </button>
        <button
          type="button"
          onClick={onConfirmDelete}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 bg-rose-50 px-3 py-1.5 text-xs font-medium text-danger hover:bg-rose-100 disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" />
          Excluir
        </button>
      </div>
    </li>
  );
}
