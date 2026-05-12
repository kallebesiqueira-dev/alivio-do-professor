import { z } from "zod";
import { buildCorrectionUserPrompt, correctionPromptTemplate } from "@/lib/ai/prompts";
import { createGroqClient, GROQ_MODEL } from "@/lib/ai/groq";

const correctionSchema = z.object({
  summary: z.string(),
  suggestedGrade: z.number(),
  feedback: z.string(),
  weaknesses: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
});

export async function generateCorrection(input: {
  title: string;
  className: string;
  studentName: string;
  gradeScale: 10 | 100;
  content: string;
}) {
  const client = createGroqClient();
  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    response_format: { type: "json_object" },
    temperature: 0.2,
    messages: [
      { role: "system", content: correctionPromptTemplate },
      { role: "user", content: buildCorrectionUserPrompt(input) },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq não retornou uma correção válida.");
  }

  const parsed = correctionSchema.parse(JSON.parse(content));
  const boundedGrade = Math.min(input.gradeScale, Math.max(0, parsed.suggestedGrade));

  return {
    ...parsed,
    suggestedGrade: Number(boundedGrade.toFixed(1)),
    aiProvider: "groq",
    rawResponse: parsed,
  };
}