import { NextResponse } from "next/server";
import { hasSupabaseAdminEnv, hasSupabasePublicEnv } from "@/lib/env";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { getTeacherReport, parseReportFilters } from "@/lib/server/data";

export async function GET(request: Request) {
  try {
    if (!hasSupabasePublicEnv() || !hasSupabaseAdminEnv()) {
      return NextResponse.json(
        { message: "Configure o Supabase em .env.local para consultar relatórios." },
        { status: 503 },
      );
    }

    const supabase = await createSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Faça login para visualizar relatórios." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const report = await getTeacherReport(
      user.id,
      parseReportFilters({
        className: searchParams.get("className"),
        period: searchParams.get("period"),
      }),
    );

    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Falha ao carregar relatórios." },
      { status: 500 },
    );
  }
}