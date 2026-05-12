"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardList, KeyRound, Loader2, Sparkles, User } from "lucide-react";

type AccountPanelProps = {
  email: string;
  createdAt: string;
  stats: {
    totalAssignments: number;
    totalPlans: number;
    totalApproved: number;
  };
};

export function AccountPanel({ email, createdAt, stats }: AccountPanelProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage({ text: "A senha deve ter no mínimo 8 caracteres.", ok: false });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: "As senhas não coincidem.", ok: false });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { message?: string };
      setMessage({ text: data.message ?? "Senha atualizada.", ok: res.ok });
      if (res.ok) {
        setPassword("");
        setConfirmPassword("");
      }
    } catch {
      setMessage({ text: "Falha ao atualizar a senha.", ok: false });
    } finally {
      setIsLoading(false);
    }
  }

  const joined = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
    new Date(createdAt),
  );

  return (
    <div className="space-y-5">
      <section className="card-shadow rounded-xl border border-border bg-white/90 p-6 backdrop-blur sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Perfil</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Minha conta
        </h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          Gerencie suas informações e credenciais de acesso.
        </p>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Atividades enviadas"
          value={stats.totalAssignments}
          colorClass="bg-amber-50 text-amber-600 border-amber-200"
          valueClass="text-amber-700"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Correções aprovadas"
          value={stats.totalApproved}
          colorClass="bg-emerald-50 text-emerald-600 border-emerald-200"
          valueClass="text-emerald-700"
        />
        <StatCard
          icon={<Sparkles className="h-5 w-5" />}
          label="Planos de aula"
          value={stats.totalPlans}
          colorClass="bg-violet-50 text-violet-600 border-violet-200"
          valueClass="text-violet-700"
        />
      </section>

      {/* Account info */}
      <section className="card-shadow rounded-xl border border-border bg-white/90 p-6 sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </span>
          <h2 className="text-base font-bold text-foreground">Informações da conta</h2>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-4">
            <dt className="text-xs font-medium uppercase tracking-widest text-muted">E-mail</dt>
            <dd className="mt-1.5 break-all text-sm font-medium text-foreground">{email}</dd>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <dt className="text-xs font-medium uppercase tracking-widest text-muted">
              Membro desde
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-foreground">{joined}</dd>
          </div>
        </dl>
      </section>

      {/* Change password */}
      <section className="card-shadow rounded-xl border border-border bg-white/90 p-6 sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <KeyRound className="h-5 w-5 text-primary" />
          </span>
          <div>
            <h2 className="text-base font-bold text-foreground">Alterar senha</h2>
            <p className="text-sm text-muted">Mínimo de 8 caracteres.</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">Nova senha</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                maxLength={128}
                autoComplete="new-password"
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">Confirmar nova senha</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                maxLength={128}
                autoComplete="new-password"
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          {message && (
            <p
              className={`rounded-lg border px-4 py-3 text-sm ${
                message.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-danger"
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || !password || !confirmPassword}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {isLoading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  colorClass,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
  valueClass: string;
}) {
  return (
    <article className={`card-shadow rounded-xl border bg-white/90 p-5 backdrop-blur ${colorClass}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className={`rounded-lg p-2 ${colorClass}`}>{icon}</span>
      </div>
      <strong className={`mt-4 block text-3xl font-bold ${valueClass}`}>{value}</strong>
    </article>
  );
}
