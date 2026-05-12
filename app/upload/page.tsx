import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { UploadWorkflow } from "@/components/upload-workflow";
import { signOutAction } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell userEmail={user.email ?? "professor@escola.com"} onLogout={signOutAction}>
      <UploadWorkflow />
    </AppShell>
  );
}