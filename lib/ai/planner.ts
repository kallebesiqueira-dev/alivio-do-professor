import { z } from "zod";
import { createGroqClient, GROQ_MODEL } from "@/lib/ai/groq";
import { buildLessonPlannerPrompt } from "@/lib/ai/prompts";
import type { LessonPlanResult } from "@/lib/types";

const lessonPlanSchema = z.object({
  topic: z.string(),
  gradeLevel: z.string(),
  objectives: z.array(z.string()),
  activities: z.array(z.string()),
  exercises: z.array(z.string()),
  evaluation: z.array(z.string()),
  teachingTips: z.array(z.string()),
});

const SYSTEM_PROMPT =
  "Você cria planos de aula claros, práticos e adequados ao contexto escolar brasileiro. Responda apenas em JSON válido, sem markdown.";

export async function generateLessonPlan(input: {
  topic: string;
  gradeLevel: string;
  teachingGoal: string;
  duration: string;
}): Promise<LessonPlanResult> {
  const client = createGroqClient();
  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    response_format: { type: "json_object" },
    temperature: 0.4,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildLessonPlannerPrompt(input) },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq não retornou um plano de aula válido.");
  }

  return lessonPlanSchema.parse(JSON.parse(content));
}