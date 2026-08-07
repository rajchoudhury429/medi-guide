import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Hospital, Pill, BellRing, ShieldCheck, Siren } from "lucide-react";
import heroImage from "@/assets/hero-mediguide.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediGuide AI — AI symptom guidance & health companion" },
      {
        name: "description",
        content:
          "Check symptoms with AI, look up medicine information, find nearby hospitals and pharmacies, book doctors and never miss a dose.",
      },
      { property: "og:title", content: "MediGuide AI — AI symptom guidance & health companion" },
      {
        property: "og:description",
        content:
          "Check symptoms with AI, look up medicine information, find nearby hospitals and book doctors — all in one secure app.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Sparkles, title: "AI symptom checker", text: "Describe how you feel in plain words and get structured, informational guidance." },
  { icon: Pill, title: "Medicine information", text: "Uses, side effects, warnings, age limits, pregnancy notes and interactions." },
  { icon: Hospital, title: "Care near you", text: "Hospitals, clinics and pharmacies sorted by distance with call and directions." },
  { icon: BellRing, title: "Medicine reminders", text: "Schedule doses, get reminders and keep a daily history of what you took." },
  { icon: Siren, title: "Emergency SOS", text: "One tap to call for help and share your live location with your contacts." },
  { icon: ShieldCheck, title: "Private records", text: "Prescriptions, lab reports and X-rays stored securely, visible only to you." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="font-display text-lg font-semibold text-foreground">
          Medi<span className="text-primary">Guide</span> AI
        </span>
        <Link
          to="/auth"
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Sign in
        </Link>
      </header>

      <section className="mx-auto grid max-w-5xl items-center gap-8 px-5 pb-14 pt-6 md:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-foreground">
            Informational guidance, not a diagnosis
          </span>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-foreground md:text-5xl">
            Your pocket health companion
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Describe your symptoms in your own words. MediGuide AI explains what could be going on,
            what you can do at home, and exactly when to see a doctor.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-card transition-transform active:scale-95"
            >
              Get started free
            </Link>
          </div>
        </div>
        <img
          src={heroImage}
          alt="MediGuide AI symptom checker on a smartphone"
          className="w-full rounded-3xl shadow-card"
        />
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-16">
        <h2 className="text-xl font-semibold text-foreground">Everything in one place</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="rounded-2xl bg-card p-5 shadow-card">
              <feature.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-5 py-8 text-center text-xs text-muted-foreground">
        MediGuide AI provides general health information only and never replaces professional
        medical advice, diagnosis or treatment.
      </footer>
    </div>
  );
}
