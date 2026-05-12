import { BookOpen, Terminal } from "lucide-react";

type SetupPanelProps = {
  title: string;
  description: string;
};

export function SetupPanel({ title, description }: SetupPanelProps) {
  return (
    <main className="soft-grid flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="card-shadow w-full max-w-2xl rounded-xl border border-border bg-white/90 p-8 backdrop-blur sm:p-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">
            Configuração pendente
          </p>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-muted">{description}</p>

        <div className="mt-6 rounded-lg border border-border bg-surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <Terminal className="h-4 w-4 text-muted" />
            <span className="text-xs font-medium uppercase tracking-widest text-muted">.env.local</span>
          </div>
          <pre className="overflow-x-auto font-mono text-xs leading-6 text-foreground">
            {`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GROQ_API_KEY=gsk_...`}
          </pre>
        </div>

        <p className="mt-5 text-sm text-muted">
          Crie o arquivo <code className="rounded bg-surface-strong px-1.5 py-0.5 font-mono text-xs text-foreground">.env.local</code> na raiz do projeto com as variáveis acima para liberar autenticação, dashboard e APIs protegidas.
        </p>
      </section>
    </main>
  );
}
