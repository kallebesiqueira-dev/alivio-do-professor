import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CorrectionsReviewList } from "@/components/corrections-review-list";
import { signOutAction } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import { getTeacherCorrections } from "@/lib/server/data";

export default async function CorrectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const corrections = await getTeacherCorrections(user.id);

  return (
    <AppShell userEmail={user.email ?? "professor@escola.com"} onLogout={signOutAction}>
      <CorrectionsReviewList initialCorrections={corrections} />
    </AppShell>
  );
}