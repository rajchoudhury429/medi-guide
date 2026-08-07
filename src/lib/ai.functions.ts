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

function getGroqApiKey(): string {
  // Check process.env first
  let key = (process.env.GROQ_API_KEY || "").trim();
  if (key && !key.includes("placeholder")) {
    return key;
  }

  // Fallback: read directly from .env file in process.cwd()
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("GROQ_API_KEY=")) {
          key = trimmed.replace("GROQ_API_KEY=", "").trim().replace(/^["']|["']$/g, "");
          if (key && !key.includes("placeholder")) {
            return key;
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to read .env file for GROQ_API_KEY:", err);
  }

  return key;
}

export const askSymptomAI = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const groqKey = getGroqApiKey();

    if (!groqKey || groqKey.includes("placeholder")) {
      throw new Error("GROQ_API_KEY is missing or invalid in .env file.");
    }

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...data.messages,
          ],
          temperature: 0.5,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Groq API error HTTP", response.status, errorText);
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

      return { text: replyText };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("askSymptomAI error:", message);
      throw new Error(message);
    }
  });


