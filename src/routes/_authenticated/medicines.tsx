import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Loader2, Pill, ShieldAlert, Baby, HeartPulse, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/medicines")({
  head: () => ({
    meta: [
      { title: "Medicine information — MediGuide AI" },
      { name: "description", content: "Look up medicines: uses, dosage guidance from the label, side effects, warnings, age restrictions, pregnancy notes and interactions." },
      { property: "og:title", content: "Medicine information — MediGuide AI" },
      { property: "og:description", content: "Uses, side effects, warnings, age limits, pregnancy notes and drug interactions." },
    ],
  }),
  component: MedicinesPage,
});

type Medicine = {
  id: string;
  name: string;
  generic_name: string | null;
  category: string | null;
  uses: string;
  dosage_guidance: string | null;
  side_effects: string | null;
  warnings: string | null;
  age_restrictions: string | null;
  pregnancy_warning: string | null;
  interactions: string | null;
  prescription_required: boolean;
};

const MOCK_MEDICINES: Medicine[] = [
  {
    id: "med-1",
    name: "Paracetamol (Acetaminophen)",
    generic_name: "Paracetamol 500mg",
    category: "Analgesic & Antipyretic",
    uses: "Relief of mild to moderate pain (headache, toothache, muscle aches) and reduction of fever.",
    dosage_guidance: "Adults: 500mg - 1000mg every 4 to 6 hours as needed. Do not exceed 4000mg in 24 hours.",
    side_effects: "Rare when taken as directed. Nausea or allergic skin rash may occur rarely.",
    warnings: "Do not combine with other paracetamol-containing products. Severe liver damage may occur if daily max dose is exceeded.",
    age_restrictions: "Suitable for adults and children over 12. Use pediatric suspension for younger children.",
    pregnancy_warning: "Considered safe during pregnancy at lowest effective dose for shortest duration.",
    interactions: "Warfarin (long-term use), alcohol, and other hepatotoxic medications.",
    prescription_required: false,
  },
  {
    id: "med-2",
    name: "Ibuprofen",
    generic_name: "Ibuprofen 400mg",
    category: "NSAID (Pain & Inflammation)",
    uses: "Relief of inflammatory pain, fever, joint stiffness, dental pain and dysmenorrhea.",
    dosage_guidance: "Take 200mg - 400mg with food or milk every 6 to 8 hours. Max 1200mg/day OTC.",
    side_effects: "Upset stomach, heartburn, mild dizziness or nausea.",
    warnings: "Take with food to minimize gastric irritation. Avoid if you have active stomach ulcers or asthma.",
    age_restrictions: "Not recommended for infants under 3 months or weighing less than 5kg.",
    pregnancy_warning: "Avoid during the 3rd trimester of pregnancy due to risks to unborn baby.",
    interactions: "Aspirin, blood thinners, blood pressure medications (ACE inhibitors), corticosteroids.",
    prescription_required: false,
  },
  {
    id: "med-3",
    name: "Cetirizine",
    generic_name: "Cetirizine Hydrochloride 10mg",
    category: "Antihistamine",
    uses: "Relief of allergy symptoms: sneezing, runny nose, watery eyes, itching, and hives.",
    dosage_guidance: "Adults & children 12+: One 10mg tablet once daily with water.",
    side_effects: "Drowsiness, dry mouth, tiredness or mild fatigue.",
    warnings: "Use caution when driving or operating machinery until you know how it affects you.",
    age_restrictions: "Tablets for 6+ years. Liquids available for children 2–6.",
    pregnancy_warning: "Consult doctor before use during pregnancy or breastfeeding.",
    interactions: "Alcohol and sedatives may increase drowsiness.",
    prescription_required: false,
  },
  {
    id: "med-4",
    name: "Amoxicillin",
    generic_name: "Amoxicillin Trihydrate 500mg",
    category: "Antibiotic (Penicillin)",
    uses: "Treatment of bacterial infections of the respiratory tract, ears, sinus, skin and urinary tract.",
    dosage_guidance: "As prescribed by physician. Complete full course even if feeling better.",
    side_effects: "Nausea, diarrhea, stomach upset or skin rash.",
    warnings: "Do not use if allergic to penicillin or cephalosporin antibiotics.",
    age_restrictions: "Prescription dose determined by doctor based on body weight and age.",
    pregnancy_warning: "Generally considered safe in pregnancy under medical supervision.",
    interactions: "Oral contraceptives (may reduce effectiveness), methotrexate, blood thinners.",
    prescription_required: true,
  },
];

function MedicinesPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Medicine | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["medicines"],
    queryFn: async () => {
      try {
        const { data: rows, error } = await supabase.from("medicines").select("*").order("name");
        if (error || !rows || rows.length === 0) return MOCK_MEDICINES;
        return rows as Medicine[];
      } catch {
        return MOCK_MEDICINES;
      }
    },
  });

  const results = useMemo(() => {
    if (!data) return [];
    const term = query.trim().toLowerCase();
    if (!term) return data;
    return data.filter((medicine) =>
      [medicine.name, medicine.generic_name, medicine.category, medicine.uses]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(term)),
    );
  }, [data, query]);

  return (
    <div>
      <PageHeader title="Medicine information" subtitle="General information from product labels — not a prescription." />

      <div className="mx-5 flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-card">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search medicines"
          maxLength={80}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <ul className="mt-4 space-y-3 px-5 pb-6">
        {isLoading ? (
          <li className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </li>
        ) : null}

        {results.map((medicine) => (
          <li key={medicine.id}>
            <button
              type="button"
              onClick={() => setSelected(medicine)}
              className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-card"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Pill className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{medicine.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {medicine.generic_name} · {medicine.category}
                </span>
              </span>
              {medicine.prescription_required ? (
                <span className="rounded-full bg-warning-soft px-2 py-1 text-[10px] font-semibold text-warning-foreground">
                  Rx
                </span>
              ) : (
                <span className="rounded-full bg-accent-soft px-2 py-1 text-[10px] font-semibold text-accent-foreground">
                  OTC
                </span>
              )}
            </button>
          </li>
        ))}

        {!isLoading && results.length === 0 ? (
          <li className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
            No medicine matches “{query}”.
          </li>
        ) : null}
      </ul>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>
                  {selected.generic_name} · {selected.category}
                  {selected.prescription_required ? " · Prescription only" : " · Over the counter"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <Section icon={HeartPulse} title="Uses" body={selected.uses} />
                <Section icon={Pill} title="Dosage guidance" body={selected.dosage_guidance} />
                <Section icon={AlertTriangle} title="Side effects" body={selected.side_effects} />
                <Section icon={ShieldAlert} title="Warnings" body={selected.warnings} />
                <Section icon={Baby} title="Age restrictions" body={selected.age_restrictions} />
                <Section icon={Baby} title="Pregnancy" body={selected.pregnancy_warning} />
                <Section icon={ShieldAlert} title="Drug interactions" body={selected.interactions} />
              </div>

              <p className="rounded-xl bg-warning-soft px-3 py-2 text-xs text-warning-foreground">
                Always follow the dosage printed on the product label and ask a pharmacist or doctor
                if you are unsure.
              </p>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string | null;
}) {
  if (!body) return null;
  return (
    <div>
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </h3>
      <p className="mt-1 text-sm text-foreground">{body}</p>
    </div>
  );
}
