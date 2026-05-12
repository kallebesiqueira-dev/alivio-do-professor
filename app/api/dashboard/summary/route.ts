import { NextResponse } from "next/server";
import { hasSupabaseAdminEnv, hasSupabasePublicEnv } from "@/lib/env";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { getTeacherDashboardData } from "@/lib/server/data";

export async function GET() {
  try {
    if (!hasSupabasePublicEnv() || !hasSupabaseAdminEnv()) {
      return NextResponse.json(
        { message: "Configure o Supabase em .env.local para consultar o dashboard." },
        { status: 503 },
      );
    }

    const supabase = await createSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Faça login para visualizar o painel." }, { status: 401 });
    }

    const dashboard = await getTeacherDashboardData(user.id);
    return NextResponse.json(dashboard);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Falha ao carregar o resumo do painel." },
      { status: 500 },
    );
  }
}