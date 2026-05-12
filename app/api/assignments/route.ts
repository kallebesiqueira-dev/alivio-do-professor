import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractAssignmentText } from "@/lib/ocr/extract-text";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 20;
const MAX_TEXT_LENGTH = 50_000;
const MAX_FIELD_LENGTH = 200;
const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

function guessSourceType(fileType?: string | null, fileName?: string | null) {
  const normalizedType = fileType?.toLowerCase() ?? "";
  const normalizedName = fileName?.toLowerCase() ?? "";

  if (normalizedType.includes("pdf") || normalizedName.endsWith(".pdf")) {
    return "pdf" as const;
  }

  return "image" as const;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.-]+/g, "-");
}

function truncate(value: string, max: number) {
  return value.slice(0, max);
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID obrigatório." }, { status: 400 });

    const supabase = await createSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });

    const admin = createAdminClient();
    const { error } = await admin
      .from("assignments")
      .delete()
      .eq("id", id)
      .eq("teacher_id", user.id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ message: "Atividade excluída." });
  } catch (error) {
    return NextResponse.json({ message: "Falha ao excluir atividade." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Faça login para enviar tarefas." }, { status: 401 });
    }

    const formData = await request.formData();
    const title = truncate(String(formData.get("title") || "Atividade sem título"), MAX_FIELD_LENGTH);
    const className = truncate(String(formData.get("className") || "Turma não informada"), MAX_FIELD_LENGTH);
    const defaultStudentName = truncate(String(formData.get("studentName") || "").trim(), MAX_FIELD_LENGTH);
    const rawText = truncate(String(formData.get("textInput") || "").trim(), MAX_TEXT_LENGTH);
    const gradeScale = Number(formData.get("gradeScale") || 10) === 100 ? 100 : 10;
    const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);

    if (files.length === 0 && !rawText) {
      return NextResponse.json(
        { message: "Envie ao menos um arquivo ou uma resposta em texto." },
        { status: 400 },
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { message: `Máximo de ${MAX_FILES} arquivos por envio.` },
        { status: 400 },
      );
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: `O arquivo "${file.name}" excede o limite de 10 MB.` },
          { status: 400 },
        );
      }
      if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json(
          { message: `Tipo de arquivo não permitido. Use PDF, JPG, PNG ou WEBP.` },
          { status: 400 },
        );
      }
    }

    const admin = createAdminClient();
    const createdItems: Array<{
      id: string;
      studentName: string;
      sourceType: string;
      status: string;
      extractedTextLength: number;
    }> = [];

    if (rawText) {
      const { data, error } = await admin
        .from("assignments")
        .insert({
          teacher_id: user.id,
          title,
          class_name: className,
          student_name: defaultStudentName || "Resposta em texto",
          source_type: "text",
          grade_scale: gradeScale,
          input_text: rawText,
          extracted_text: rawText,
          status: "uploaded",
        })
        .select("id, student_name, source_type, status, extracted_text")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      createdItems.push({
        id: data.id,
        studentName: data.student_name,
        sourceType: data.source_type,
        status: data.status,
        extractedTextLength: data.extracted_text?.length ?? 0,
      });
    }

    for (const file of files) {
      const sourceType = guessSourceType(file.type, file.name);
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const storagePath = `${user.id}/${Date.now()}-${sanitizeFileName(file.name)}`;

      const uploadResult = await admin.storage.from("assignments").upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message);
      }

      const extractedText = await extractAssignmentText({
        sourceType,
        fileBuffer,
        mimeType: file.type,
      });

      const studentName = defaultStudentName || file.name.replace(/\.[^.]+$/, "");
      const { data, error } = await admin
        .from("assignments")
        .insert({
          teacher_id: user.id,
          title,
          class_name: className,
          student_name: truncate(studentName, MAX_FIELD_LENGTH),
          source_type: sourceType,
          grade_scale: gradeScale,
          file_path: storagePath,
          extracted_text: extractedText,
          status: "uploaded",
        })
        .select("id, student_name, source_type, status, extracted_text")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      createdItems.push({
        id: data.id,
        studentName: data.student_name,
        sourceType: data.source_type,
        status: data.status,
        extractedTextLength: data.extracted_text?.length ?? 0,
      });
    }

    return NextResponse.json({
      message: `${createdItems.length} tarefa(s) pronta(s) para processamento.`,
      items: createdItems,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Falha ao enviar tarefas.",
      },
      { status: 500 },
    );
  }
}
