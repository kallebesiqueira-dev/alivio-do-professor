"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, LogOut, Menu, X } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";

type AppShellProps = {
  children: React.ReactNode;
  userEmail: string;
  onLogout: (formData: FormData) => Promise<void>;
};

function SidebarContent({
  userEmail,
  onLogout,
  onNavigate,
}: {
  userEmail: string;
  onLogout: (formData: FormData) => Promise<void>;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div>
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onNavigate}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
            <BookOpen className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Alívio do Professor</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-400">
              IA pedagógica
            </p>
          </div>
        </Link>
      </div>

      <div className="min-h-0 flex-1 flex flex-col">
        <SidebarNav onNavigate={onNavigate} />
      </div>

      <div className="shrink-0 space-y-2">
        <div className="rounded-lg border border-white/8 bg-white/5 px-3 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sessão ativa</p>
          <p className="mt-1.5 truncate text-sm font-medium text-slate-200">{userEmail}</p>
        </div>
        <form action={onLogout}>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/8 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </button>
        </form>
      </div>
    </>
  );
}

export function AppShell({ children, userEmail, onLogout }: AppShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/20">
            <BookOpen className="h-4 w-4 text-amber-400" />
          </div>
          <span className="text-sm font-bold text-foreground">Alívio do Professor</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="rounded-lg p-2 text-muted hover:bg-surface"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile sidebar drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="card-shadow absolute left-0 top-0 flex h-full w-72 flex-col gap-4 overflow-hidden border-r border-white/10 bg-emerald-950 px-5 py-5 text-white">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              userEmail={userEmail}
              onLogout={onLogout}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Desktop layout */}
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 lg:flex-row lg:px-6">
        <aside className="card-shadow hidden w-64 shrink-0 flex-col gap-4 rounded-xl border border-white/10 bg-emerald-950 px-5 py-5 text-white lg:sticky lg:top-4 lg:flex lg:h-[calc(100vh-2rem)] lg:overflow-hidden">
          <SidebarContent userEmail={userEmail} onLogout={onLogout} />
        </aside>

        <div className="flex-1 px-0 pt-4 lg:px-6 lg:pt-0">{children}</div>
      </div>
    </div>
  );
}
