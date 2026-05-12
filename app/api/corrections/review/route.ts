import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const requestSchema = z.object({
  correctionId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  status: z.enum(["pending_review", "approved", "rejected"]),
  finalGrade: z.number().min(0),
  finalFeedback: z.string().min(1),
  reviewNotes: z.string().nullable().optional(),
});

export async function PATCH(request: Request) {
  try {
    const supabase = await createSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Faça login para revisar correções." }, { status: 401 });
    }

    const payload = requestSchema.parse(await request.json());
    const admin = createAdminClient();

    const correctionStatus = payload.status === "pending_review" ? "pending_review" : payload.status;
    const assignmentStatus =
      payload.status === "approved"
        ? "approved"
        : payload.status === "rejected"
          ? "rejected"
          : "review_pending";

    const { error: correctionError } = await admin
      .from("corrections")
      .update({
        final_grade: payload.finalGrade,
        final_feedback: payload.finalFeedback,
        review_notes: payload.reviewNotes ?? null,
        status: correctionStatus,
        approved_at: payload.status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", payload.correctionId)
      .eq("teacher_id", user.id);

    if (correctionError) {
      throw new Error(correctionError.message);
    }

    const { error: assignmentError } = await admin
      .from("assignments")
      .update({ status: assignmentStatus })
      .eq("id", payload.assignmentId)
      .eq("teacher_id", user.id);

    if (assignmentError) {
      throw new Error(assignmentError.message);
    }

    return NextResponse.json({
      message:
        payload.status === "approved"
          ? "Correção aprovada com sucesso."
          : payload.status === "rejected"
            ? "Correção rejeitada."
            : "Rascunho da revisão salvo.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Falha ao revisar correção.",
      },
      { status: 500 },
    );
  }
}