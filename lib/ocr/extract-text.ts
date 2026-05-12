import { PDFParse } from "pdf-parse";
import { requireEnv } from "@/lib/env";

async function extractFromPdf(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text?.trim() ?? "";
}

async function extractFromMathpix(buffer: Buffer, mimeType: string) {
  const appId = requireEnv("MATHPIX_APP_ID");
  const appKey = requireEnv("MATHPIX_APP_KEY");

  const response = await fetch("https://api.mathpix.com/v3/text", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      app_id: appId,
      app_key: appKey,
    },
    body: JSON.stringify({
      src: `data:${mimeType};base64,${buffer.toString("base64")}`,
      formats: ["text"],
      data_options: {
        include_asciimath: false,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Não foi possível ler o arquivo com o OCR configurado.");
  }

  const payload = (await response.json()) as { text?: string };
  return payload.text?.trim() ?? "";
}

export async function extractAssignmentText(input: {
  sourceType: "text" | "pdf" | "image";
  rawText?: string | null;
  fileBuffer?: Buffer | null;
  mimeType?: string | null;
}) {
  if (input.sourceType === "text") {
    return input.rawText?.trim() ?? "";
  }

  if (!input.fileBuffer) {
    throw new Error("Nenhum arquivo foi recebido para extração de texto.");
  }

  if (input.sourceType === "pdf") {
    const text = await extractFromPdf(input.fileBuffer);

    if (text) {
      return text;
    }

    throw new Error(
      "O PDF parece ser escaneado. Configure o OCR com Mathpix para processar este tipo de arquivo.",
    );
  }

  if (!input.mimeType) {
    throw new Error("Tipo do arquivo de imagem não identificado.");
  }

  return extractFromMathpix(input.fileBuffer, input.mimeType);
}