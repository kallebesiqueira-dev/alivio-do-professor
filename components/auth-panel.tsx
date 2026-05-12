type AuthPanelProps = {
  mode: "login" | "signup";
  title: string;
  description: string;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
};

export function AuthPanel({ mode, title, description, action, submitLabel }: AuthPanelProps) {
  return (
    <section className="card-shadow rounded-xl border border-border bg-white/90 p-5 backdrop-blur">
      <div className="mb-5">
        <span className="inline-block rounded-md bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
          {mode === "login" ? "Entrar" : "Cadastro"}
        </span>
        <h2 className="mt-2.5 text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-muted">{description}</p>
      </div>

      <form action={action} className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">E-mail</span>
          <input
            name="email"
            type="email"
            required
            placeholder="voce@escola.com.br"
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-primary"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Senha</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-primary"
          />
        </label>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-strong"
        >
          {submitLabel}
        </button>
      </form>
    </section>
  );
}
