import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Loader2,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Stethoscope,
  Cpu,
  History,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { askSymptomAI } from "@/lib/ai.functions";
import { saveSymptomCheckFn, getSymptomChecksFn } from "@/lib/user.functions";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { AiMarkdown } from "@/components/AiMarkdown";
import { VoiceButton } from "@/components/VoiceButton";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({ q: z.string().max(500).optional() });

export const Route = createFileRoute("/_authenticated/ai")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "AI symptom checker — MediGuide AI" },
      { name: "description", content: "Describe your symptoms in plain language and get structured, informational guidance with self-care advice and emergency warning signs." },
      { property: "og:title", content: "AI symptom checker — MediGuide AI" },
      { property: "og:description", content: "Structured, informational symptom guidance — never a diagnosis." },
    ],
  }),
  component: SymptomChecker,
});

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "I have a headache and mild fever since yesterday",
  "Sore throat with dry cough for 3 days",
  "Stomach pain after meals this week",
  "Persistent lower back stiffness after sitting",
];

const CARE_MODES = [
  "General Symptom Check",
  "Pediatric & Child Care",
  "Senior Health",
  "Post-Workout Soreness",
];

function generateFallbackAiResponse(userQuery: string): string {
  const q = userQuery.toLowerCase();
  if (q.includes("chest pain") || q.includes("breath") || q.includes("stroke") || q.includes("unresponsive")) {
    return `🚨 **CALL EMERGENCY SERVICES NOW** (e.g. 911 / 112 / 102).
The symptoms you described may indicate a critical emergency requiring immediate medical care.

## Emergency warning signs
* Chest pain, pressure, difficulty breathing, or sudden numbness.
* Go to the nearest emergency room immediately.`;
  }

  return `## Possible conditions
*This is general information, not a diagnosis.*
* Common viral infection or mild stress (Common)
* Seasonal allergy or dehydration (Common)
* Tension headache or fatigue (Less common)

## Self-care advice
* Get plenty of rest and drink 8–10 glasses of water daily.
* Use a warm or cold compress to relieve mild discomfort.
* Avoid heavy exertion until you feel fully recovered.

## Common over-the-counter options
Over-the-counter options such as acetaminophen (paracetamol) or ibuprofen are commonly used for fever or mild pain. Always follow instructions on the product packaging and check for precautions.

## Emergency warning signs
* High fever (>102°F or 39°C) that does not respond to medication.
* Shortness of breath, severe abdominal pain, or sudden dizziness.

## When to see a doctor
* If symptoms persist for more than 3 to 5 days without improvement.
* If you develop new or worsening symptoms.`;
}

function SymptomChecker() {
  const { q } = Route.useSearch();
  const { user } = useSession();
  const queryClient = useQueryClient();

  const ask = useServerFn(askSymptomAI);
  const saveSymptomServer = useServerFn(saveSymptomCheckFn);
  const getSymptomServer = useServerFn(getSymptomChecksFn);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [activeCareMode, setActiveCareMode] = useState<string>("General Symptom Check");
  const [showHistory, setShowHistory] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef<string | undefined>(undefined);

  // Fetch saved AI chat history for user account
  const { data: savedHistory } = useQuery({
    queryKey: ["saved-ai-chats", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      try {
        if (!user?.id) return [];
        const res = await getSymptomServer({ data: { userId: user.id } });
        return res ?? [];
      } catch {
        return [];
      }
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (q && seededRef.current !== q) {
      seededRef.current = q;
      void send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function copyText(text: string, index: number) {
    void navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("AI advice copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function speakText(text: string, index: number) {
    if (!("speechSynthesis" in window)) {
      return toast.error("Text-to-speech is not supported in this browser.");
    }

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/#/g, "").replace(/\*/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 500));
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  }

  function loadPastChat(entry: any) {
    if (entry.messages && entry.messages.length > 0) {
      setMessages(entry.messages);
    } else {
      setMessages([
        { role: "user", content: entry.symptoms },
        { role: "assistant", content: entry.summary },
      ]);
    }
    setShowHistory(false);
    toast.info("Loaded saved chat session");
  }

  async function send(text: string) {
    const value = text.trim();
    if (!value || busy) return;

    const queryWithMode = activeCareMode !== "General Symptom Check" ? `[Mode: ${activeCareMode}] ${value}` : value;
    const nextMessages: Message[] = [...messages, { role: "user", content: queryWithMode }];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);

    try {
      const result = await ask({ data: { messages: nextMessages.slice(-20) } });
      if (!result?.text) {
        throw new Error("No response received from Groq AI service.");
      }

      const reply = result.text;
      const updatedMessages: Message[] = [...nextMessages, { role: "assistant", content: reply }];
      setMessages(updatedMessages);

      if (user?.id) {
        try {
          // Save AI chat persistently to account in local file database
          await saveSymptomServer({
            data: {
              userId: user.id,
              symptoms: value.slice(0, 500),
              summary: reply.slice(0, 3000),
              messages: updatedMessages,
            },
          });
          queryClient.invalidateQueries({ queryKey: ["saved-ai-chats", user.id] });
          queryClient.invalidateQueries({ queryKey: ["recent-checks", user.id] });
        } catch {
          // fallback Supabase insert
          try {
            await supabase.from("symptom_checks").insert({
              user_id: user.id,
              symptoms: value.slice(0, 500),
              summary: reply.slice(0, 2000),
            });
          } catch {
            // ignore
          }
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.error("AI Consultation error:", errMsg);
      toast.error(errMsg);

      const errorNotice = `⚠️ **Groq AI Service Notice**\n\nCould not fetch response from Groq AI: ${errMsg}\n\nPlease check that your \`GROQ_API_KEY\` in \`.env\` is active.`;
      setMessages([...nextMessages, { role: "assistant", content: errorNotice }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col pb-6">
      <PageHeader
        title="AI symptom checker"
        subtitle="Describe how you feel — powered by Groq Llama 3.3 70B AI engine."
        action={
          <div className="flex items-center gap-1.5">
            {savedHistory && savedHistory.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory((prev) => !prev)}
                className="rounded-xl text-xs gap-1.5"
              >
                <History className="h-3.5 w-3.5 text-primary" />
                Saved ({savedHistory.length})
                {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            ) : null}
            {messages.length > 0 ? (
              <Button variant="ghost" size="icon" onClick={() => setMessages([])} aria-label="Start over" className="rounded-xl">
                <RotateCcw className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        }
      />

      {/* Groq Engine Badge & Care Mode Selector */}
      <div className="px-5 mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Cpu className="h-3.5 w-3.5" />
          Groq Llama-3.3 70B Engine Active
        </span>

        <div className="no-scrollbar flex gap-1.5 overflow-x-auto py-1">
          {CARE_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setActiveCareMode(mode)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                activeCareMode === mode
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary text-muted-foreground hover:bg-card"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Saved AI Chat History Accordion */}
      {showHistory && savedHistory && savedHistory.length > 0 ? (
        <div className="mx-5 mb-4 rounded-2xl bg-card p-4 shadow-card border border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Saved AI Consultations</h3>
            <span className="text-[11px] text-emerald-600 font-semibold">Saved to your account</span>
          </div>
          <div className="max-h-56 overflow-y-auto space-y-2 pt-1 pr-1">
            {savedHistory.map((item: any) => (
              <button
                key={item.id}
                type="button"
                onClick={() => loadPastChat(item)}
                className="w-full text-left rounded-xl bg-secondary p-3 text-xs hover:bg-primary-soft transition-colors flex items-start gap-2.5"
              >
                <MessageSquare className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{item.symptoms}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(item.created_at).toLocaleDateString()} · {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mx-5 flex items-start gap-2 rounded-2xl bg-warning-soft px-4 py-3 text-xs text-warning-foreground">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Informational guidance only — this is not a diagnosis. In an emergency, call your local
          emergency number immediately.
        </p>
      </div>

      <div className="flex-1 space-y-4 px-5 py-5">
        {messages.length === 0 && !busy ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Suggested Starters
            </div>
            {STARTERS.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => void send(starter)}
                className="w-full rounded-2xl bg-card px-4 py-3.5 text-left text-sm text-foreground shadow-card border border-border/40 transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                {starter}
              </button>
            ))}
          </div>
        ) : null}

        {messages.map((message, index) =>
          message.role === "user" ? (
            <div key={index} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground shadow-sm">
                {message.content}
              </p>
            </div>
          ) : (
            <div key={index} className="rounded-2xl rounded-bl-md bg-card p-4.5 shadow-card border border-border/40 space-y-3">
              <AiMarkdown text={message.content} />

              {/* Quick Actions Bar below AI advice */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => copyText(message.content, index)}
                    className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-secondary/80"
                  >
                    {copiedIndex === index ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    {copiedIndex === index ? "Copied" : "Copy"}
                  </button>

                  <button
                    type="button"
                    onClick={() => speakText(message.content, index)}
                    className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-secondary/80"
                  >
                    {speakingIndex === index ? <VolumeX className="h-3 w-3 text-destructive" /> : <Volume2 className="h-3 w-3 text-primary" />}
                    {speakingIndex === index ? "Stop" : "Listen"}
                  </button>
                </div>

                <Link
                  to="/doctors"
                  className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                >
                  <Stethoscope className="h-3 w-3" /> Find Specialist Doctor
                </Link>
              </div>
            </div>
          ),
        )}

        {busy ? (
          <div className="flex items-center gap-2.5 rounded-2xl bg-card px-4 py-3.5 text-sm text-muted-foreground shadow-card border border-border/40">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Groq Llama 3.3 AI analyzing your symptoms…
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
        className="sticky bottom-20 mx-5 mb-2 flex items-center gap-2 rounded-2xl bg-card p-2 shadow-card border border-border/50 backdrop-blur-xl"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Describe your symptoms..."
          maxLength={500}
          className="w-full bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <VoiceButton onResult={(text) => setInput((prev) => (prev ? `${prev} ${text}` : text))} />
        <Button type="submit" size="icon" className="rounded-xl shrink-0" disabled={busy || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}


