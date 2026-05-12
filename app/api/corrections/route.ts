import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID obrigatório." }, { status: 400 });

    const supabase = await createSessionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });

    const admin = createAdminClient();
    const { error } = await admin
      .from("corrections")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("teacher_id", user.id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ message: "Correção movida para a lixeira." });
  } catch (error) {
    console.error("[DELETE /api/corrections]", error);
    return NextResponse.json({ message: "Falha ao mover para lixeira." }, { status: 500 });
  }
}
