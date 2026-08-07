import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Search,
  Sparkles,
  Stethoscope,
  CalendarPlus,
  BellRing,
  FolderHeart,
  Siren,
  Clock,
  Droplets,
  Activity,
  CheckCircle2,
  ChevronRight,
  Flame,
  Moon,
  Pill,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { useI18n } from "@/lib/i18n";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — MediGuide AI" },
      { name: "description", content: "Your complete health dashboard: AI symptom checker, daily vitals, medicine schedule and health insights." },
      { property: "og:title", content: "Home — MediGuide AI" },
      { property: "og:description", content: "AI symptom checker, vitals tracking, medicine reminders and emergency health guidance." },
    ],
  }),
  component: HomePage,
});

const SYMPTOM_PRESETS = [
  { label: "Headache & Fever", query: "I have a throbbing headache and mild fever since morning" },
  { label: "Sore Throat & Cough", query: "Sore throat with dry cough and difficulty swallowing" },
  { label: "Stomach Pain & Nausea", query: "Sharp stomach pain after eating with mild nausea" },
  { label: "Back Stiffness", query: "Lower back stiffness and muscle pain after sitting long hours" },
  { label: "Seasonal Allergies", query: "Frequent sneezing, watery eyes and runny nose today" },
  { label: "Acid Reflux / Heartburn", query: "Burning sensation in upper chest and acid reflux after meals" },
];

const HEALTH_ARTICLES = [
  {
    category: "Hydration & Metabolism",
    title: "The 8-Glass Rule: How Water Elevates Focus and Recovery",
    readTime: "3 min read",
    gradient: "from-blue-500/20 to-cyan-500/10",
  },
  {
    category: "Heart & Cardio",
    title: "Understanding Resting Heart Rate & Daily Activity Spikes",
    readTime: "4 min read",
    gradient: "from-rose-500/20 to-pink-500/10",
  },
  {
    category: "Sleep Architecture",
    title: "Deep Sleep Cycles: Why Consistency Trumps Hours",
    readTime: "5 min read",
    gradient: "from-purple-500/20 to-indigo-500/10",
  },
  {
    category: "Preventive Care",
    title: "Essential Annual Screening Tests Every Adult Should Know",
    readTime: "4 min read",
    gradient: "from-emerald-500/20 to-teal-500/10",
  },
];

const QUICK = [
  { to: "/doctors", icon: Stethoscope, label: "common.doctors", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { to: "/appointments", icon: CalendarPlus, label: "common.appointments", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { to: "/reminders", icon: BellRing, label: "common.reminders", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { to: "/records", icon: FolderHeart, label: "common.records", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
] as const;

function HomePage() {
  const { user } = useSession();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState("");

  // Interactive local water intake counter
  const [waterGlasses, setWaterGlasses] = useState<number>(() => {
    try {
      return Number(localStorage.getItem("mediguide_water_glasses")) || 4;
    } catch {
      return 4;
    }
  });

  // Tracked medicines taken today
  const [takenMeds, setTakenMeds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      localStorage.setItem("mediguide_water_glasses", String(waterGlasses));
    } catch {
      // ignore storage error
    }
  }, [waterGlasses]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user!.id)
          .maybeSingle();
        if (error) return null;
        return data;
      } catch {
        return null;
      }
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["recent-checks", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("symptom_checks")
          .select("id, symptoms, created_at")
          .order("created_at", { ascending: false })
          .limit(5);
        if (error) return null;
        return data;
      } catch {
        return null;
      }
    },
  });

  const firstName = (profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email ?? "there").split(" ")[0];

  function analyze(text: string) {
    const value = text.trim();
    if (!value) return;
    navigate({ to: "/ai", search: { q: value.slice(0, 500) } });
  }

  function addWater() {
    if (waterGlasses >= 12) return toast.info("Goal reached! 12 glasses logged today.");
    setWaterGlasses((prev) => prev + 1);
    toast.success(`Hydration updated: ${waterGlasses + 1} / 8 glasses (+250 ml)`);
  }

  function toggleMedTaken(id: string, name: string) {
    setTakenMeds((prev) => {
      const next = !prev[id];
      if (next) toast.success(`Marked ${name} as taken`);
      return { ...prev, [id]: next };
    });
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Greeting Section */}
      <section className="bg-hero-gradient px-5 pb-16 pt-10 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Health Companion Active
            </span>
            <h1 className="mt-3 text-2xl font-semibold">Good day, {firstName} 👋</h1>
            <p className="mt-1 text-xs opacity-90">How are you feeling right now?</p>
          </div>
        </div>
      </section>

      {/* Main AI Symptom Input Bar */}
      <section className="-mt-12 px-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            analyze(symptoms);
          }}
          className="rounded-3xl bg-card p-4 shadow-card transition-all focus-within:shadow-xl"
        >
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
              placeholder={t("home.search")}
              maxLength={500}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <VoiceButton
              onResult={(text) => setSymptoms((prev) => (prev ? `${prev} ${text}` : text))}
            />
          </div>
          <Button type="submit" className="mt-3.5 w-full rounded-xl gap-2 font-medium" size="lg">
            <Sparkles className="h-4 w-4" />
            {t("home.analyze")}
          </Button>
        </form>
      </section>

      {/* Quick AI Symptom Presets */}
      <section className="px-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Common Symptoms & Questions
          </h2>
          <span className="text-[11px] text-primary">Instant AI Analysis</span>
        </div>
        <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-1">
          {SYMPTOM_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => analyze(preset.query)}
              className="shrink-0 rounded-full bg-card border border-border/50 px-3.5 py-2 text-xs font-medium text-foreground shadow-sm transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-95"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      {/* Daily Health Vitals Dashboard */}
      <section className="px-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Daily Health Vitals & Activity
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {/* Water Intake Card */}
          <div className="rounded-2xl bg-card p-4 shadow-card border border-border/40">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Droplets className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold text-muted-foreground">{waterGlasses}/8 glasses</span>
            </div>
            <h3 className="mt-3 text-xs font-medium text-muted-foreground">Water Hydration</h3>
            <p className="text-lg font-bold text-foreground">{(waterGlasses * 0.25).toFixed(1)} L</p>
            <div className="mt-2.5 flex items-center gap-1.5">
              <div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (waterGlasses / 8) * 100)}%` }}
                />
              </div>
              <button
                type="button"
                onClick={addWater}
                className="shrink-0 rounded-lg bg-blue-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-600 active:scale-95"
              >
                + Water
              </button>
            </div>
          </div>

          {/* Wellness Score Card */}
          <div className="rounded-2xl bg-card p-4 shadow-card border border-border/40">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Activity className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">Optimal</span>
            </div>
            <h3 className="mt-3 text-xs font-medium text-muted-foreground">Wellness Score</h3>
            <p className="text-lg font-bold text-foreground">88 <span className="text-xs font-normal text-muted-foreground">/ 100</span></p>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Flame className="h-3 w-3 text-amber-500" /> 420 kcal
              </span>
              <span className="flex items-center gap-1">
                <Moon className="h-3 w-3 text-purple-500" /> 7.5 hrs
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Medications Schedule */}
      <section className="px-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Today's Medicine Reminders
          </h2>
          <Link to="/reminders" className="flex items-center text-xs font-medium text-primary hover:underline">
            Manage <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-2.5 space-y-2">
          {[
            { id: "med-1", name: "Paracetamol 500mg", dosage: "1 Tablet after breakfast", time: "09:00 AM" },
            { id: "med-2", name: "Vitamin D3 Supplement", dosage: "1 Capsule after dinner", time: "08:30 PM" },
          ].map((med) => {
            const taken = takenMeds[med.id];
            return (
              <div
                key={med.id}
                className="flex items-center justify-between rounded-2xl bg-card px-4 py-3.5 shadow-card border border-border/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Pill className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className={`text-sm font-semibold ${taken ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {med.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{med.dosage} · {med.time}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleMedTaken(med.id, med.name)}
                  className={`flex h-8 items-center gap-1 rounded-xl px-3 text-xs font-medium transition-all ${
                    taken
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  {taken ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Taken
                    </>
                  ) : (
                    "Mark Done"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Navigation Services */}
      <section className="px-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("home.quick")}</h2>
        <div className="mt-2.5 grid grid-cols-4 gap-3">
          {QUICK.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-2 rounded-2xl bg-card p-3 text-center shadow-card border border-border/40 transition-transform hover:-translate-y-0.5 active:scale-95"
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-semibold leading-tight text-foreground">
                {t(item.label)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent AI Symptom Checks */}
      {recent && recent.length > 0 ? (
        <section className="px-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("home.recent")}</h2>
          <ul className="mt-2.5 space-y-2">
            {recent.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => analyze(item.symptoms)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left shadow-card border border-border/40 hover:border-primary/30"
                >
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-1 text-sm font-medium text-foreground">{item.symptoms}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Featured Health Articles */}
      <section>
        <div className="flex items-center justify-between px-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("home.tips")}</h2>
          <span className="text-[11px] text-muted-foreground">Updated daily</span>
        </div>
        <div className="no-scrollbar mt-2.5 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-5 pb-2">
          {HEALTH_ARTICLES.map((article) => (
            <article
              key={article.title}
              className={`w-72 shrink-0 snap-start rounded-2xl bg-gradient-to-br ${article.gradient} bg-card p-4.5 border border-border/50 shadow-card flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-primary">{article.category}</span>
                  <span className="text-muted-foreground">{article.readTime}</span>
                </div>
                <h3 className="mt-2 text-sm font-semibold leading-snug text-foreground">{article.title}</h3>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">
                Read Article <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Emergency SOS Banner */}
      <section className="px-5">
        <Link
          to="/sos"
          className="flex items-center justify-between rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-4 text-destructive shadow-sm transition-all hover:bg-destructive/15 active:scale-95"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive text-destructive-foreground">
              <Siren className="h-5 w-5 animate-pulse" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">{t("common.emergency")}</p>
              <p className="text-xs text-muted-foreground">
                One-tap emergency call & live GPS location dispatch
              </p>
            </div>
          </div>
          <Zap className="h-5 w-5 text-destructive shrink-0" />
        </Link>
      </section>
    </div>
  );
}

