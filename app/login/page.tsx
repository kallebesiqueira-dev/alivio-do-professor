import { redirect } from "next/navigation";
import { BookOpen, ClipboardCheck, PencilLine, ShieldCheck } from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";
import { SetupPanel } from "@/components/setup-panel";
import { hasSupabasePublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { signInAction, signUpAction } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (!hasSupabasePublicEnv()) {
    return (
      <SetupPanel
        title="Conecte o Supabase para liberar o acesso"
        description="A tela de login está pronta, mas o ambiente local ainda não recebeu as credenciais públicas do Supabase."
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  const { message } = await searchParams;

  return (
    <main className="soft-grid flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-4xl gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Left info panel */}
        <section className="card-shadow flex flex-col justify-between rounded-xl border border-white/10 bg-emerald-950 p-6 text-white">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
                <BookOpen className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Alívio do Professor</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-400">
                  IA pedagógica
                </p>
              </div>
            </div>

            <h1 className="mt-6 text-2xl font-bold leading-snug tracking-tight">
              Corrija, revise e planeje com apoio de IA.
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Plataforma para professores do ensino fundamental e médio — direta e com você no controle.
            </p>
          </div>

          <div className="mt-6 space-y-2">
            <Feature icon={<PencilLine className="h-4 w-4 text-amber-400" />} text="Correção com nota, feedback e pontos de atenção." />
            <Feature icon={<ClipboardCheck className="h-4 w-4 text-emerald-400" />} text="Aprovação manual obrigatória antes de finalizar." />
            <Feature icon={<ShieldCheck className="h-4 w-4 text-violet-400" />} text="Planejamento de aulas com objetivos e avaliação." />
          </div>
        </section>

        {/* Right auth panels */}
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthPanel
            mode="login"
            title="Entrar"
            description="Acesse com seu e-mail e senha."
            action={signInAction}
            submitLabel="Entrar"
          />
          <AuthPanel
            mode="signup"
            title="Criar conta"
            description="Cadastre-se para começar a usar."
            action={signUpAction}
            submitLabel="Criar acesso"
          />
        </div>
      </div>

      {message ? (
        <div className="fixed bottom-5 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-border bg-white px-4 py-3 text-center text-sm text-foreground shadow-lg">
          {message}
        </div>
      ) : null}
    </main>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/8 bg-white/5 px-3 py-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <p className="text-sm leading-5 text-slate-300">{text}</p>
    </div>
  );
}
