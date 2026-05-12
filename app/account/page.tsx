import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AccountPanel } from "@/components/account-panel";
import { signOutAction } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const { count: totalAssignments } = await admin
    .from("assignments")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", user.id);

  const { count: totalPlans } = await admin
    .from("lesson_plans")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", user.id)
    .is("deleted_at", null);

  const { count: totalApproved } = await admin
    .from("corrections")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", user.id)
    .eq("status", "approved");

  return (
    <AppShell userEmail={user.email ?? "professor@escola.com"} onLogout={signOutAction}>
      <AccountPanel
        email={user.email ?? ""}
        createdAt={user.created_at}
        stats={{
          totalAssignments: totalAssignments ?? 0,
          totalPlans: totalPlans ?? 0,
          totalApproved: totalApproved ?? 0,
        }}
      />
    </AppShell>
  );
}
