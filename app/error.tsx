"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="soft-grid flex min-h-screen items-center justify-center px-4 py-10">
      <section className="card-shadow w-full max-w-md rounded-xl border border-border bg-white/90 p-8 text-center backdrop-blur sm:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-rose-100">
          <AlertTriangle className="h-7 w-7 text-danger" />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-danger">Erro inesperado</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
          Algo deu errado
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          Ocorreu um erro ao carregar esta página. Tente novamente ou volte mais tarde.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-strong"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      </section>
    </main>
  );
}
