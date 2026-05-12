"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const authSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

function getErrorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Não foi possível validar os dados.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocorreu um erro inesperado. Tente novamente.";
}

export async function signInAction(formData: FormData) {
  try {
    const input = authSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(input);

    if (error) {
      throw error;
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
  } catch (error) {
    redirect(`/login?message=${encodeURIComponent(getErrorMessage(error))}`);
  }
}

export async function signUpAction(formData: FormData) {
  try {
    const input = authSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp(input);

    if (error) {
      throw error;
    }

    redirect(
      "/login?message=" +
        encodeURIComponent("Conta criada. Faça login para acessar o painel do professor."),
    );
  } catch (error) {
    redirect(`/login?message=${encodeURIComponent(getErrorMessage(error))}`);
  }
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?message=" + encodeURIComponent("Sessão encerrada com sucesso."));
}