import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CalendarView } from "@/components/calendar-view";
import { signOutAction } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell userEmail={user.email ?? ""} onLogout={signOutAction}>
      <CalendarView />
    </AppShell>
  );
}
