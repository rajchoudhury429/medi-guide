import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

const ChatInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
});

const SYSTEM_PROMPT = `You are MediGuide AI, a helpful health & medical information assistant inside a consumer health app.

You are NOT a doctor and you never diagnose. Always be calm, clear, plain-spoken, and helpful.

Behaviour:
- If the user asks a GENERAL medical or health question (e.g. "What is Viruses?", "What is diabetes?", "How does immunity work?"), provide a direct, clear, informative, and easy-to-understand explanation.
- If the user describes PERSONAL SYMPTOMS (e.g. "I have a headache and fever since morning"):
  - If the description is very vague, ask at most 2 short follow-up questions.
  - Once enough detail is provided, give structured guidance using these headings:

## Possible conditions
*This is general information, not a diagnosis.*
- 2 to 4 possibilities with likelihood.

## Self-care advice
- 3 to 5 actionable bullets.

## Common over-the-counter options
- General info on OTC options, label reminders, and precautions.

## Emergency warning signs
- Critical warning signs requiring immediate emergency room attention.

## When to see a doctor
- 2 to 3 guidelines on when to consult a physician.

Rules:
- In emergencies (chest pain, stroke signs, severe difficulty breathing, unresponsiveness), lead with an urgent line telling them to call emergency services (911 / 112 / 102) immediately.
- Never give personalized prescriptions or state absolute diagnostic certainty.`;

function getGroqConfig(): { apiKey: string; preferredModel: string } {
  // Check process.env and runtime environments first
  let key = (
    process.env.GROQ_API_KEY ||
    process.env.NITRO_GROQ_API_KEY ||
    process.env.VITE_GROQ_API_KEY ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_GROQ_API_KEY) ||
    ""
  ).trim();

  let model = (
    process.env.GROQ_MODEL ||
    process.env.NITRO_GROQ_MODEL ||
    process.env.VITE_GROQ_MODEL ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_GROQ_MODEL) ||
    ""
  ).trim();

  // Fallback: search .env / .env.local in candidate directory paths
  if (!key || key.includes("placeholder")) {
    const candidateEnvFiles = [".env", ".env.local", ".env.production"];
    const candidateDirs = [
      process.cwd(),
      path.resolve(process.cwd(), ".."),
      path.resolve(process.cwd(), "../.."),
    ];

    for (const dir of candidateDirs) {
      for (const file of candidateEnvFiles) {
        try {
          const envPath = path.resolve(dir, file);
          if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, "utf-8");
            const lines = content.split(/\r?\n/);
            for (const line of lines) {
              const trimmed = line.trim();
              if (
                (!key || key.includes("placeholder")) &&
                (trimmed.startsWith("GROQ_API_KEY=") ||
                  trimmed.startsWith("NITRO_GROQ_API_KEY=") ||
                  trimmed.startsWith("VITE_GROQ_API_KEY="))
              ) {
                key = trimmed
                  .replace(/^(GROQ_API_KEY|NITRO_GROQ_API_KEY|VITE_GROQ_API_KEY)=/, "")
                  .trim()
                  .replace(/^["']|["']$/g, "");
              }
              if (
                !model &&
                (trimmed.startsWith("GROQ_MODEL=") ||
                  trimmed.startsWith("NITRO_GROQ_MODEL=") ||
                  trimmed.startsWith("VITE_GROQ_MODEL="))
              ) {
                model = trimmed
                  .replace(/^(GROQ_MODEL|NITRO_GROQ_MODEL|VITE_GROQ_MODEL)=/, "")
                  .trim()
                  .replace(/^["']|["']$/g, "");
              }
            }
            if (key && !key.includes("placeholder")) break;
          }
        } catch {
          // continue searching
        }
      }
      if (key && !key.includes("placeholder")) break;
    }
  }

  return {
    apiKey: key,
    preferredModel: model || "openai/gpt-oss-120b",
  };
}

// Fallback candidate models in case the preferred model is not available on the Groq tier
const DEFAULT_CANDIDATE_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

export const askSymptomAI = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const { apiKey: groqKey, preferredModel } = getGroqConfig();

    if (!groqKey || groqKey.includes("placeholder")) {
      throw new Error(
        "GROQ_API_KEY is not configured. If running locally, check your .env file. If deployed on Netlify, add GROQ_API_KEY in Netlify Site Configuration -> Environment Variables."
      );
    }

    // Ensure preferred model is first, followed by alternates without duplicates
    const candidateModels = Array.from(
      new Set([preferredModel, ...DEFAULT_CANDIDATE_MODELS])
    );

    let lastError: Error | null = null;

    for (const model of candidateModels) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...data.messages,
            ],
            temperature: 0.5,
            max_tokens: 1500,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`Groq API attempt with model '${model}' returned HTTP ${response.status}:`, errorText);

          // If the model is not found or not accessible on this account (404), fall back to next candidate
          if (
            response.status === 404 ||
            errorText.includes("model_not_found") ||
            errorText.includes("does not exist")
          ) {
            lastError = new Error(`Model '${model}' not available on Groq: ${errorText.slice(0, 150)}`);
            continue;
          }

          if (response.status === 429) {
            throw new Error("Groq API rate limit reached. Please wait a few seconds.");
          }
          if (response.status === 401) {
            throw new Error("Invalid GROQ_API_KEY. Please verify your Groq API key.");
          }
          throw new Error(`Groq API error (${response.status}): ${errorText.slice(0, 200)}`);
        }

        const json = await response.json();
        const replyText = json.choices?.[0]?.message?.content;

        if (!replyText) {
          throw new Error("Received empty response from Groq AI.");
        }

        return { text: replyText, model };
      } catch (err: any) {
        // Immediate rethrow for hard authentication or rate limit errors
        if (
          err?.message?.includes("rate limit") ||
          err?.message?.includes("Invalid GROQ_API_KEY")
        ) {
          throw err;
        }
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    const message = lastError?.message || "All candidate Groq models failed.";
    console.error("askSymptomAI final error:", message);
    throw new Error(message);
  });


