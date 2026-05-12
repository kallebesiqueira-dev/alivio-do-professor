"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type EventType = "aula" | "prova" | "ferias" | "recuperacao" | "reuniao" | "outro";

type CalendarEvent = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  type: EventType;
  turma?: string | null;
  description?: string | null;
  created_at: string;
};

type FormState = {
  title: string;
  start_date: string;
  end_date: string;
  type: EventType;
  turma: string;
  description: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const EVENT_META: Record<EventType, { label: string; dot: string; chip: string; badge: string }> = {
  aula:        { label: "Aula",        dot: "bg-amber-400",   chip: "bg-amber-100 text-amber-800 border-amber-200",      badge: "bg-amber-50 border-amber-300 text-amber-800" },
  prova:       { label: "Prova",       dot: "bg-rose-400",    chip: "bg-rose-100 text-rose-800 border-rose-200",          badge: "bg-rose-50 border-rose-300 text-rose-800" },
  ferias:      { label: "Férias",      dot: "bg-emerald-400", chip: "bg-emerald-100 text-emerald-800 border-emerald-200", badge: "bg-emerald-50 border-emerald-300 text-emerald-800" },
  recuperacao: { label: "Recuperação", dot: "bg-violet-400",  chip: "bg-violet-100 text-violet-800 border-violet-200",   badge: "bg-violet-50 border-violet-300 text-violet-800" },
  reuniao:     { label: "Reunião",     dot: "bg-sky-400",     chip: "bg-sky-100 text-sky-800 border-sky-200",             badge: "bg-sky-50 border-sky-300 text-sky-800" },
  outro:       { label: "Outro",       dot: "bg-slate-400",   chip: "bg-slate-100 text-slate-700 border-slate-200",       badge: "bg-slate-50 border-slate-300 text-slate-700" },
};

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const EMPTY_FORM: FormState = {
  title: "", start_date: "", end_date: "", type: "aula", turma: "", description: "",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDisplay(ymd: string) {
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

function eventSpansDay(event: CalendarEvent, ymd: string) {
  return event.start_date <= ymd && event.end_date >= ymd;
}

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getUpcoming(events: CalendarEvent[], days = 30) {
  const today = toYMD(new Date());
  const limit = toYMD(new Date(Date.now() + days * 86400000));
  return events
    .filter((e) => e.end_date >= today && e.start_date <= limit)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 12);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TypeButton({
  type, selected, onClick,
}: {
  type: EventType; selected: boolean; onClick: () => void;
}) {
  const meta = EVENT_META[type];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
        selected
          ? cn(meta.badge, "shadow-sm")
          : "border-border bg-white text-muted hover:border-primary/40",
      )}
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)} />
      {meta.label}
    </button>
  );
}

function EventChip({
  event, onEdit, onDelete,
}: {
  event: CalendarEvent; onEdit: () => void; onDelete: () => void;
}) {
  const meta = EVENT_META[event.type];
  const isMultiDay = event.start_date !== event.end_date;
  return (
    <div className={cn("flex items-start justify-between gap-2 rounded-lg border p-3", meta.chip)}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)} />
          <p className="truncate text-sm font-semibold">{event.title}</p>
        </div>
        {event.turma && <p className="mt-0.5 text-xs opacity-70">{event.turma}</p>}
        {isMultiDay && (
          <p className="mt-0.5 text-xs opacity-70">
            {formatDisplay(event.start_date)} → {formatDisplay(event.end_date)}
          </p>
        )}
        {event.description && (
          <p className="mt-1 text-xs leading-5 opacity-80">{event.description}</p>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md p-1 opacity-60 hover:opacity-100"
          aria-label="Editar evento"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md p-1 opacity-60 hover:opacity-100"
          aria-label="Remover evento"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CalendarView() {
  const today = toYMD(new Date());
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(today);
  const [form, setForm] = useState<FormState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar?year=${year}&month=${month}`);
      const data = await res.json() as { events?: CalendarEvent[] };
      setEvents(data.events ?? []);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  function selectDay(ymd: string) {
    setSelectedDay(ymd);
    setForm(null);
    setEditingId(null);
  }

  function openAdd(day: string) {
    setSelectedDay(day);
    setEditingId(null);
    setForm({ ...EMPTY_FORM, start_date: day, end_date: day });
    setMessage(null);
  }

  function openEdit(event: CalendarEvent) {
    setEditingId(event.id);
    setForm({
      title: event.title,
      start_date: event.start_date,
      end_date: event.end_date,
      type: event.type,
      turma: event.turma ?? "",
      description: event.description ?? "",
    });
    setMessage(null);
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        ...form,
        turma: form.turma || undefined,
        description: form.description || undefined,
        ...(editingId ? { id: editingId } : {}),
      };
      const res = await fetch("/api/calendar", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { message?: string };
      if (!res.ok) { setMessage(data.message ?? "Erro ao salvar."); return; }
      setForm(null);
      setEditingId(null);
      await fetchEvents();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/calendar?id=${id}`, { method: "DELETE" });
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  const cells = buildCalendarDays(year, month);
  const upcoming = getUpcoming(events);
  const selectedEvents = selectedDay
    ? events.filter(e => eventSpansDay(e, selectedDay))
    : [];

  const thisMonthYMD = `${year}-${String(month).padStart(2, "0")}`;
  const statsMonth = events.filter(
    e => e.start_date.startsWith(thisMonthYMD) || e.end_date.startsWith(thisMonthYMD),
  );
  const countByType = (t: EventType) => statsMonth.filter(e => e.type === t).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="card-shadow rounded-xl border border-border bg-white/90 p-5 backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Organização</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Calendário escolar
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Organize aulas, provas, férias e recuperações num só lugar.
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-2">
            {(["aula", "prova", "ferias", "recuperacao"] as EventType[]).map(t => {
              const n = countByType(t);
              if (!n) return null;
              return (
                <span key={t} className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium", EVENT_META[t].chip)}>
                  {n} {EVENT_META[t].label.toLowerCase()}{n > 1 ? "s" : ""}
                </span>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-4">
          {(Object.keys(EVENT_META) as EventType[]).map(t => (
            <span key={t} className="flex items-center gap-1.5 text-xs text-muted">
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", EVENT_META[t].dot)} />
              {EVENT_META[t].label}
            </span>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        {/* ── Calendar grid ── */}
        <section className="card-shadow rounded-xl border border-border bg-white/90 p-5 backdrop-blur">
          {/* Month navigation */}
          <div className="mb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg border border-border p-2 text-muted hover:bg-surface hover:text-foreground"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-base font-bold text-foreground">
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg border border-border p-2 text-muted hover:bg-surface hover:text-foreground"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="mb-1 grid grid-cols-7">
            {DAY_LABELS.map((d, i) => (
              <div
                key={d}
                className={cn(
                  "pb-1 text-center text-[11px] font-semibold uppercase tracking-wide",
                  i === 0 || i === 6 ? "text-muted/60" : "text-muted",
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="grid grid-cols-7 divide-x divide-y divide-border">
                {cells.map((day, idx) => {
                  if (!day) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="min-h-[64px] bg-slate-50/60 sm:min-h-[80px]"
                      />
                    );
                  }

                  const ymd = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isToday = ymd === today;
                  const isSelected = ymd === selectedDay;
                  const dayEvents = events.filter(e => eventSpansDay(e, ymd));
                  const isWeekend = (idx % 7 === 0 || idx % 7 === 6);

                  return (
                    // div instead of button to allow nested buttons inside
                    <div
                      key={ymd}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectDay(ymd)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") selectDay(ymd); }}
                      className={cn(
                        "group relative flex min-h-[64px] cursor-pointer flex-col gap-1 p-1.5 sm:min-h-[80px]",
                        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                        isSelected
                          ? "bg-amber-50"
                          : isWeekend
                          ? "bg-slate-50/60 hover:bg-amber-50/40"
                          : "bg-white hover:bg-amber-50/40",
                      )}
                    >
                      {/* Day number */}
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                          isToday
                            ? "bg-primary text-white"
                            : isSelected
                            ? "bg-amber-200 text-amber-900"
                            : isWeekend
                            ? "text-muted/70"
                            : "text-foreground",
                        )}
                      >
                        {day}
                      </span>

                      {/* Event dots */}
                      {dayEvents.length > 0 && (
                        <div className="flex flex-wrap gap-0.5">
                          {dayEvents.slice(0, 3).map(e => (
                            <span key={e.id} className={cn("h-1.5 w-1.5 rounded-full", EVENT_META[e.type].dot)} />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[9px] font-bold text-muted">+{dayEvents.length - 3}</span>
                          )}
                        </div>
                      )}

                      {/* Event labels (md+ screens only) */}
                      <div className="hidden flex-col gap-0.5 md:flex">
                        {dayEvents.slice(0, 2).map(e => (
                          <span
                            key={e.id}
                            className={cn(
                              "truncate rounded px-1 text-[10px] font-medium leading-4",
                              EVENT_META[e.type].chip,
                            )}
                          >
                            {e.title}
                          </span>
                        ))}
                      </div>

                      {/* Add button on hover — separate button inside div is valid now */}
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); openAdd(ymd); }}
                        className="absolute right-1 top-1 hidden rounded p-0.5 text-muted opacity-0 transition-opacity hover:bg-amber-100 hover:text-primary group-hover:opacity-100 sm:block"
                        aria-label={`Adicionar evento em ${formatDisplay(ymd)}`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mobile: add button for selected day */}
          {selectedDay && !form && (
            <div className="mt-4 xl:hidden">
              <button
                type="button"
                onClick={() => openAdd(selectedDay)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-strong"
              >
                <Plus className="h-4 w-4" />
                Adicionar evento em {formatDisplay(selectedDay)}
              </button>
            </div>
          )}
        </section>

        {/* ── Right panel: day detail + form + upcoming ── */}
        <div className="flex flex-col gap-4">
          {/* Day panel */}
          <section className="card-shadow rounded-xl border border-border bg-white/90 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted">
                  {selectedDay ? formatDisplay(selectedDay) : "Selecione um dia"}
                </p>
                <h3 className="mt-1 text-sm font-bold text-foreground">
                  {selectedDay === today
                    ? "Hoje"
                    : selectedDay
                    ? MONTH_NAMES[parseInt(selectedDay.split("-")[1]) - 1]
                    : "Clique em um dia"}
                </h3>
              </div>
              {selectedDay && !form && (
                <button
                  type="button"
                  onClick={() => openAdd(selectedDay)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-strong"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </button>
              )}
            </div>

            {/* Events for selected day */}
            {!form && (
              <div className="space-y-2">
                {selectedEvents.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-surface py-6 text-center">
                    <CalendarDays className="mx-auto mb-2 h-6 w-6 text-muted/50" />
                    <p className="text-xs text-muted">Nenhum evento neste dia</p>
                  </div>
                ) : (
                  selectedEvents.map(e => (
                    <EventChip
                      key={e.id}
                      event={e}
                      onEdit={() => openEdit(e)}
                      onDelete={() => handleDelete(e.id)}
                    />
                  ))
                )}
              </div>
            )}

            {/* Add / Edit form */}
            {form && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {editingId ? "Editar evento" : "Novo evento"}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setForm(null); setEditingId(null); }}
                    className="rounded-lg p-1 text-muted hover:bg-surface"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Type selector */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted">Tipo</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(EVENT_META) as EventType[]).map(t => (
                      <TypeButton
                        key={t}
                        type={t}
                        selected={form.type === t}
                        onClick={() => setForm(f => f ? { ...f, type: t } : f)}
                      />
                    ))}
                  </div>
                </div>

                {/* Title */}
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-foreground">Título *</span>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => f ? { ...f, title: e.target.value } : f)}
                    maxLength={200}
                    placeholder="Ex: Prova de Matemática"
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </label>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-foreground">Início *</span>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={e =>
                        setForm(f =>
                          f
                            ? {
                                ...f,
                                start_date: e.target.value,
                                end_date: f.end_date < e.target.value ? e.target.value : f.end_date,
                              }
                            : f,
                        )
                      }
                      className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-foreground">Fim</span>
                    <input
                      type="date"
                      value={form.end_date}
                      min={form.start_date}
                      onChange={e => setForm(f => f ? { ...f, end_date: e.target.value } : f)}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </label>
                </div>

                {/* Turma */}
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-foreground">Turma</span>
                  <input
                    value={form.turma}
                    onChange={e => setForm(f => f ? { ...f, turma: e.target.value } : f)}
                    maxLength={100}
                    placeholder="Ex: 7º ano A"
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </label>

                {/* Description */}
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-foreground">Observações</span>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => f ? { ...f, description: e.target.value } : f)}
                    maxLength={1000}
                    rows={3}
                    placeholder="Conteúdo, sala, material necessário..."
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-primary"
                  />
                </label>

                {message && (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-danger">
                    {message}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !form.title || !form.start_date}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar evento"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setForm(null); setEditingId(null); }}
                    className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Upcoming events */}
          <section className="card-shadow rounded-xl border border-white/10 bg-emerald-950 p-5 text-white">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-400">
              Próximos 30 dias
            </p>
            <h3 className="mb-4 text-sm font-bold">Agenda</h3>
            {upcoming.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-5 text-center">
                <BookOpen className="mx-auto mb-2 h-5 w-5 text-slate-500" />
                <p className="text-xs text-slate-400">Nenhum evento nos próximos 30 dias</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {upcoming.map(e => {
                  const meta = EVENT_META[e.type];
                  const isMultiDay = e.start_date !== e.end_date;
                  return (
                    <li
                      key={e.id}
                      className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-3"
                    >
                      <span className={cn("mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full", meta.dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-white">{e.title}</p>
                        {e.turma && <p className="text-[11px] text-slate-400">{e.turma}</p>}
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {isMultiDay
                            ? `${formatDisplay(e.start_date)} → ${formatDisplay(e.end_date)}`
                            : formatDisplay(e.start_date)}
                        </p>
                      </div>
                      <span className={cn("shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium", meta.chip)}>
                        {meta.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
