import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSessionClient } from "@/lib/supabase/server";

const passwordSchema = z.object({
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres.").max(128),
});

export async function PATCH(request: Request) {
  try {
    const supabase = await createSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const body = passwordSchema.parse(await request.json());

    const { error } = await supabase.auth.updateUser({ password: body.password });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Senha atualizada com sucesso." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return NextResponse.json({ message: first?.message ?? "Dados inválidos." }, { status: 400 });
    }
    return NextResponse.json({ message: "Falha ao atualizar a senha." }, { status: 500 });
  }
}
