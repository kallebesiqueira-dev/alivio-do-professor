import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createSessionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });

    const admin = createAdminClient();

    const [plansRes, correctionsRes] = await Promise.all([
      admin
        .from("lesson_plans")
        .select("id, topic, grade_level, duration, deleted_at")
        .eq("teacher_id", user.id)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false }),
      admin
        .from("corrections")
        .select("id, assignment_id, suggested_grade, deleted_at, assignments!inner(title, student_name, class_name)")
        .eq("teacher_id", user.id)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false }),
    ]);

    if (plansRes.error) throw new Error(plansRes.error.message);
    if (correctionsRes.error) throw new Error(correctionsRes.error.message);

    const corrections = (correctionsRes.data ?? []).map((item) => ({
      ...item,
      assignments: Array.isArray(item.assignments) ? item.assignments[0] : item.assignments,
    }));

    return NextResponse.json({ lessonPlans: plansRes.data ?? [], corrections });
  } catch (error) {
    console.error("[GET /api/trash]", error);
    return NextResponse.json({ message: "Falha ao buscar lixeira." }, { status: 500 });
  }
}

const restoreSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["lesson_plan", "correction"]),
});

export async function PATCH(request: Request) {
  try {
    const supabase = await createSessionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });

    const body = restoreSchema.parse(await request.json());
    const admin = createAdminClient();
    const table = body.type === "lesson_plan" ? "lesson_plans" : "corrections";

    const { error } = await admin
      .from(table)
      .update({ deleted_at: null })
      .eq("id", body.id)
      .eq("teacher_id", user.id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ message: "Item restaurado com sucesso." });
  } catch (error) {
    console.error("[PATCH /api/trash]", error);
    return NextResponse.json({ message: "Falha ao restaurar item." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type") as "lesson_plan" | "correction" | null;
    if (!id || !type) return NextResponse.json({ message: "Parâmetros inválidos." }, { status: 400 });

    const supabase = await createSessionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });

    const admin = createAdminClient();

    if (type === "lesson_plan") {
      const { error } = await admin.from("lesson_plans").delete().eq("id", id).eq("teacher_id", user.id);
      if (error) throw new Error(error.message);
    } else {
      // delete the assignment → cascades to correction
      const { data: correction } = await admin
        .from("corrections")
        .select("assignment_id")
        .eq("id", id)
        .eq("teacher_id", user.id)
        .single();
      if (correction) {
        const { error } = await admin.from("assignments").delete().eq("id", correction.assignment_id).eq("teacher_id", user.id);
        if (error) throw new Error(error.message);
      }
    }

    return NextResponse.json({ message: "Excluído permanentemente." });
  } catch (error) {
    console.error("[DELETE /api/trash]", error);
    return NextResponse.json({ message: "Falha ao excluir." }, { status: 500 });
  }
}
