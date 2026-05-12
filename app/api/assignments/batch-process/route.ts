import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCorrection } from "@/lib/ai/correction";
import { checkRateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({
  assignmentIds: z.array(z.string().uuid()).min(1).max(50),
});

export async function POST(request: Request) {
  try {
    const supabase = await createSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Faça login para processar tarefas." }, { status: 401 });
    }

    // 10 batch requests per 5 minutes per user
    if (!checkRateLimit(`batch:${user.id}`, 10, 5 * 60 * 1000)) {
      return NextResponse.json(
        { message: "Muitas solicitações. Aguarde alguns minutos antes de tentar novamente." },
        { status: 429 },
      );
    }

    const payload = requestSchema.parse(await request.json());
    const admin = createAdminClient();

    const { data: assignments, error } = await admin
      .from("assignments")
      .select("id, title, class_name, student_name, grade_scale, extracted_text")
      .eq("teacher_id", user.id)
      .in("id", payload.assignmentIds);

    if (error) {
      throw new Error(error.message);
    }

    const items = [];

    for (const assignment of assignments ?? []) {
      if (!assignment.extracted_text) {
        continue;
      }

      await admin.from("assignments").update({ status: "processing" }).eq("id", assignment.id);

      try {
        const result = await generateCorrection({
          title: assignment.title,
          className: assignment.class_name,
          studentName: assignment.student_name,
          gradeScale: assignment.grade_scale,
          content: assignment.extracted_text,
        });

        const { error: correctionError } = await admin.from("corrections").upsert(
          {
            assignment_id: assignment.id,
            teacher_id: user.id,
            suggested_grade: result.suggestedGrade,
            final_grade: result.suggestedGrade,
            feedback: result.feedback,
            final_feedback: result.feedback,
            weaknesses: result.weaknesses,
            summary: result.summary,
            status: "pending_review",
            ai_provider: result.aiProvider,
            raw_response: result.rawResponse,
          },
          { onConflict: "assignment_id" },
        );

        if (correctionError) {
          throw new Error(correctionError.message);
        }

        await admin
          .from("assignments")
          .update({ status: "review_pending", processing_error: null })
          .eq("id", assignment.id);

        items.push({
          assignmentId: assignment.id,
          studentName: assignment.student_name,
          suggestedGrade: result.suggestedGrade,
          feedback: result.feedback,
          status: "pending_review",
        });
      } catch (error) {
        await admin
          .from("assignments")
          .update({
            status: "failed",
            processing_error:
              error instanceof Error ? error.message : "Falha desconhecida ao gerar correção.",
          })
          .eq("id", assignment.id);
      }
    }

    return NextResponse.json({
      message: `${items.length} correção(ões) pronta(s) para revisão.`,
      items,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Falha ao processar lote.",
      },
      { status: 500 },
    );
  }
}
