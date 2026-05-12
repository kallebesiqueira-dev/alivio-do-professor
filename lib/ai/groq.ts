import Groq from "groq-sdk";
import { requireEnv } from "@/lib/env";

export function createGroqClient() {
  return new Groq({ apiKey: requireEnv("GROQ_API_KEY") });
}

export const GROQ_MODEL = "llama-3.3-70b-versatile";
