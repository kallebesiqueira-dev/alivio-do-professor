import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const eventSchema = z.object({
  title: z.string().min(1).max(200),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["aula", "prova", "ferias", "recuperacao", "reuniao", "outro"]),
  turma: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
});

const patchSchema = eventSchema.partial().extend({ id: z.string().uuid() });

async function getUser() {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get("year") ?? new Date().getFullYear());
    const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);

    // Include events that overlap with the month (start_date <= last day AND end_date >= first day)
    const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).toISOString().slice(0, 10);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("calendar_events")
      .select("id, title, start_date, end_date, type, turma, description, created_at")
      .eq("teacher_id", user.id)
      .is("deleted_at", null)
      .lte("start_date", lastDay)
      .gte("end_date", firstDay)
      .order("start_date");

    if (error) throw new Error(error.message);
    return NextResponse.json({ events: data ?? [] });
  } catch (error) {
    return NextResponse.json({ message: "Falha ao buscar eventos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });

    const body = eventSchema.parse(await request.json());
    if (body.end_date < body.start_date) {
      return NextResponse.json({ message: "A data final não pode ser anterior à inicial." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("calendar_events")
      .insert({ ...body, teacher_id: user.id })
      .select("id, title, start_date, end_date, type, turma, description, created_at")
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ event: data, message: "Evento criado." }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
    }
    return NextResponse.json({ message: "Falha ao criar evento." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });

    const { id, ...body } = patchSchema.parse(await request.json());
    if (body.start_date && body.end_date && body.end_date < body.start_date) {
      return NextResponse.json({ message: "A data final não pode ser anterior à inicial." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("calendar_events")
      .update(body)
      .eq("id", id)
      .eq("teacher_id", user.id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ message: "Evento atualizado." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
    }
    return NextResponse.json({ message: "Falha ao atualizar evento." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID obrigatório." }, { status: 400 });

    const user = await getUser();
    if (!user) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });

    const admin = createAdminClient();
    const { error } = await admin
      .from("calendar_events")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("teacher_id", user.id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ message: "Evento removido." });
  } catch (error) {
    return NextResponse.json({ message: "Falha ao remover evento." }, { status: 500 });
  }
}
