import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LessonPlanner } from "@/components/lesson-planner";
import { signOutAction } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

export default async function PlannerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell userEmail={user.email ?? "professor@escola.com"} onLogout={signOutAction}>
      <LessonPlanner />
    </AppShell>
  );
}