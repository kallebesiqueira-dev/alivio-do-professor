import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateLessonPlan } from "@/lib/ai/planner";
import { checkRateLimit } from "@/lib/rate-limit";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID obrigatório." }, { status: 400 });

    const supabase = await createSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });

    const admin = createAdminClient();
    const { error } = await admin
      .from("lesson_plans")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("teacher_id", user.id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ message: "Plano excluído." });
  } catch (error) {
    console.error("[DELETE /api/planner]", error);
    return NextResponse.json({ message: "Falha ao excluir plano." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Faça login para ver seus planos." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("lesson_plans")
      .select("id, topic, grade_level, duration, created_at, content")
      .eq("teacher_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw new Error(error.message);

    return NextResponse.json({ plans: data ?? [] });
  } catch (error) {
    console.error("[GET /api/planner]", error);
    return NextResponse.json({ message: "Falha ao buscar planos." }, { status: 500 });
  }
}

const requestSchema = z.object({
  topic: z.string().min(2).max(200),
  gradeLevel: z.string().min(2).max(100),
  teachingGoal: z.string().min(10).max(1000),
  duration: z.string().min(2).max(50),
});

export async function POST(request: Request) {
  try {
    const supabase = await createSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Faça login para gerar planos de aula." }, { status: 401 });
    }

    // 15 plan generations per 10 minutes per user
    if (!checkRateLimit(`planner:${user.id}`, 15, 10 * 60 * 1000)) {
      return NextResponse.json(
        { message: "Muitas solicitações. Aguarde alguns minutos antes de tentar novamente." },
        { status: 429 },
      );
    }

    const payload = requestSchema.parse(await request.json());
    const plan = await generateLessonPlan(payload);
    const admin = createAdminClient();

    const { error } = await admin.from("lesson_plans").insert({
      teacher_id: user.id,
      topic: payload.topic,
      grade_level: payload.gradeLevel,
      teaching_goal: payload.teachingGoal,
      duration: payload.duration,
      content: plan,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      message: "Plano de aula gerado e salvo.",
      plan,
    });
  } catch (error) {
    console.error("[/api/planner]", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Falha ao gerar plano de aula.",
      },
      { status: 500 },
    );
  }
}