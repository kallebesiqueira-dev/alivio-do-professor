"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, CalendarDays, ClipboardList, Home, Settings, Sparkles, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/dashboard", label: "Painel", icon: Home },
  { href: "/upload", label: "Enviar atividade", icon: Upload },
  { href: "/corrections", label: "Revisar correções", icon: ClipboardList },
  { href: "/reports", label: "Relatório da turma", icon: BookOpenCheck },
  { href: "/planner", label: "Planejador de aulas", icon: Sparkles },
  { href: "/calendar", label: "Calendário", icon: CalendarDays },
  { href: "/account", label: "Minha conta", icon: Settings },
];

type SidebarNavProps = {
  onNavigate?: () => void;
};

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex min-h-0 flex-1 flex-col">
      <ul className="flex-1 overflow-y-auto space-y-1 pb-2">
        {navigationItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  isActive
                    ? "bg-amber-500/15 text-amber-300"
                    : "text-slate-300 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-amber-400" : "text-slate-400",
                  )}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="shrink-0 mt-2 border-t border-white/8 pt-3">
        <Link
          href="/trash"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
            pathname === "/trash"
              ? "bg-rose-500/15 text-rose-300"
              : "text-slate-400 hover:bg-white/8 hover:text-slate-300",
          )}
        >
          <Trash2
            className={cn(
              "h-4 w-4 shrink-0",
              pathname === "/trash" ? "text-rose-400" : "text-slate-500",
            )}
          />
          Lixeira
        </Link>
      </div>
    </nav>
  );
}
