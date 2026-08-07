import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Star, MapPin, Loader2, CalendarPlus, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/doctors")({
  head: () => ({
    meta: [
      { title: "Find a doctor — MediGuide AI" },
      { name: "description", content: "Search doctors by specialty — cardiologist, neurologist, dermatologist, dentist, pediatrician, orthopedic and ENT — with experience, rating and clinic." },
      { property: "og:title", content: "Find a doctor — MediGuide AI" },
      { property: "og:description", content: "Browse specialists with experience, ratings and clinic locations, then book an appointment." },
    ],
  }),
  component: DoctorsPage,
});

const SPECIALTIES = [
  "All",
  "Cardiologist",
  "Neurologist",
  "Dermatologist",
  "Dentist",
  "Pediatrician",
  "Orthopedic",
  "ENT",
];

const MOCK_DOCTORS = [
  {
    id: "doc-1",
    name: "Dr. Ananya Sharma",
    specialty: "Cardiologist",
    qualification: "MBBS, MD (Cardiology), FACC",
    clinic_name: "Apex Heart Care",
    city: "Mumbai",
    experience_years: 14,
    rating: 4.9,
    consultation_fee: 1200,
    phone: "+91 98765 43210",
    bio: "Preventive cardiology, hypertension and coronary care specialist.",
  },
  {
    id: "doc-2",
    name: "Dr. Rajesh Kumar",
    specialty: "Neurologist",
    qualification: "MBBS, DM (Neurology)",
    clinic_name: "NeuroLife Brain & Spine Center",
    city: "Delhi",
    experience_years: 16,
    rating: 4.8,
    consultation_fee: 1500,
    phone: "+91 98123 45678",
    bio: "Migraine management, stroke recovery, epilepsy and neuropathy specialist.",
  },
  {
    id: "doc-3",
    name: "Dr. Priya Patel",
    specialty: "Dermatologist",
    qualification: "MBBS, DDVL, MD (Dermatology)",
    clinic_name: "Glow Skin & Laser Clinic",
    city: "Bengaluru",
    experience_years: 10,
    rating: 4.7,
    consultation_fee: 1000,
    phone: "+91 99887 76655",
    bio: "Clinical dermatology, acne care, hair loss treatments and skin renewal.",
  },
  {
    id: "doc-4",
    name: "Dr. Vikram Singh",
    specialty: "Orthopedic",
    qualification: "MBBS, MS (Orthopedics)",
    clinic_name: "Joint & Spine Specialty Clinic",
    city: "Hyderabad",
    experience_years: 12,
    rating: 4.8,
    consultation_fee: 1100,
    phone: "+91 97654 32109",
    bio: "Arthroscopy, joint replacements, sports injuries and back care.",
  },
  {
    id: "doc-5",
    name: "Dr. Meera Iyer",
    specialty: "Pediatrician",
    qualification: "MBBS, DCH, MD (Pediatrics)",
    clinic_name: "Little Care Children's Clinic",
    city: "Chennai",
    experience_years: 11,
    rating: 4.9,
    consultation_fee: 900,
    phone: "+91 98400 11223",
    bio: "Comprehensive child healthcare, immunizations and growth monitoring.",
  },
];

function DoctorsPage() {
  const [specialty, setSpecialty] = useState("All");
  const [query, setQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      try {
        const { data: rows, error } = await supabase
          .from("doctors")
          .select("*")
          .order("rating", { ascending: false });
        if (error || !rows || rows.length === 0) return MOCK_DOCTORS;
        return rows;
      } catch {
        return MOCK_DOCTORS;
      }
    },
  });

  const doctors = useMemo(() => {
    if (!data) return [];
    const term = query.trim().toLowerCase();
    return data.filter((doctor) => {
      const matchSpecialty = specialty === "All" || doctor.specialty === specialty;
      const matchQuery =
        !term ||
        doctor.name.toLowerCase().includes(term) ||
        (doctor.clinic_name ?? "").toLowerCase().includes(term) ||
        (doctor.city ?? "").toLowerCase().includes(term);
      return matchSpecialty && matchQuery;
    });
  }, [data, specialty, query]);

  return (
    <div>
      <PageHeader title="Find a doctor" subtitle="Browse specialists and book an appointment." />

      <div className="mx-5 flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-card">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, clinic or city"
          maxLength={80}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5">
        {SPECIALTIES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setSpecialty(item)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              specialty === item
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground shadow-card",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3 px-5 pb-6">
        {isLoading ? (
          <li className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </li>
        ) : null}

        {doctors.map((doctor) => (
          <li key={doctor.id} className="rounded-2xl bg-card p-4 shadow-card">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-base font-semibold text-primary">
                {doctor.name.replace("Dr. ", "").charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-foreground">{doctor.name}</h2>
                <p className="text-xs font-medium text-primary">{doctor.specialty}</p>
                <p className="mt-1 text-xs text-muted-foreground">{doctor.qualification}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {doctor.clinic_name}, {doctor.city}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-secondary-foreground">
                    <Star className="h-3 w-3 fill-current text-warning" />
                    {Number(doctor.rating).toFixed(1)}
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-1 text-secondary-foreground">
                    {doctor.experience_years} yrs exp
                  </span>
                  {doctor.consultation_fee ? (
                    <span className="rounded-full bg-accent-soft px-2 py-1 text-accent-foreground">
                      ₹{doctor.consultation_fee}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {doctor.bio ? <p className="mt-3 text-xs text-muted-foreground">{doctor.bio}</p> : null}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={`tel:${doctor.phone ?? ""}`}>
                  <Phone className="h-4 w-4" />
                  Call clinic
                </a>
              </Button>
              <Button asChild size="sm">
                <Link to="/appointments" search={{ doctorId: doctor.id }}>
                  <CalendarPlus className="h-4 w-4" />
                  Book
                </Link>
              </Button>
            </div>
          </li>
        ))}

        {!isLoading && doctors.length === 0 ? (
          <li className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
            No doctors match your search.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
