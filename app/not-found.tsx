import Link from "next/link";
import { BookOpen, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="soft-grid flex min-h-screen items-center justify-center px-4 py-10">
      <section className="card-shadow w-full max-w-md rounded-xl border border-border bg-white/90 p-8 text-center backdrop-blur sm:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
          <BookOpen className="h-7 w-7 text-primary" />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Erro 404</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
          Página não encontrada
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          A página que você está procurando não existe ou foi removida.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-strong"
        >
          <Home className="h-4 w-4" />
          Voltar ao painel
        </Link>
      </section>
    </main>
  );
}
