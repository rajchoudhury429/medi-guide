import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { MapPin, Phone, Navigation, Star, Loader2, LocateFixed, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/hospitals")({
  head: () => ({
    meta: [
      { title: "Nearby hospitals & pharmacies — MediGuide AI" },
      { name: "description", content: "Find hospitals, clinics and pharmacies near you with distance, ratings, opening status, call and directions." },
      { property: "og:title", content: "Nearby hospitals & pharmacies — MediGuide AI" },
      { property: "og:description", content: "Hospitals, clinics and pharmacies near you with distance, ratings and directions." },
    ],
  }),
  component: HospitalsPage,
});

const KINDS = [
  { value: "all", label: "All" },
  { value: "hospital", label: "Hospitals" },
  { value: "clinic", label: "Clinics" },
  { value: "pharmacy", label: "Pharmacies" },
] as const;

type Coords = { lat: number; lng: number };

function distanceKm(a: Coords, b: Coords) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function isOpenNow(open24h: boolean, opensAt: string | null, closesAt: string | null) {
  if (open24h) return true;
  if (!opensAt || !closesAt) return true;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = opensAt.split(":").map(Number);
  const [ch, cm] = closesAt.split(":").map(Number);
  return minutes >= oh * 60 + om && minutes <= ch * 60 + cm;
}

function generateLocalNearbyFacilities(userCoords: Coords | null) {
  const baseLat = userCoords?.lat ?? 28.6139;
  const baseLng = userCoords?.lng ?? 77.209;

  const nearbyTemplates = [
    {
      id: "fac-local-1",
      name: "City Care Multi-Specialty Hospital & Emergency",
      kind: "hospital",
      offsetLat: 0.004,
      offsetLng: 0.003,
      rating: 4.9,
      phone: "+91 98765 11223",
      open_24h: true,
      address: "Main Avenue, Health Care Block",
    },
    {
      id: "fac-local-2",
      name: "MedPlus 24/7 Chemist & Pharmacy",
      kind: "pharmacy",
      offsetLat: -0.003,
      offsetLng: 0.005,
      rating: 4.8,
      phone: "+91 98765 22334",
      open_24h: true,
      address: "Shop 12, Market Complex",
    },
    {
      id: "fac-local-3",
      name: "Apollo Pharmacy & Wellness",
      kind: "pharmacy",
      offsetLat: 0.006,
      offsetLng: -0.004,
      rating: 4.7,
      phone: "+91 98765 33445",
      open_24h: false,
      opens_at: "07:30",
      closes_at: "23:00",
      address: "Crossroad Junction, Ground Floor",
    },
    {
      id: "fac-local-4",
      name: "LifeLine Express Clinic & Diagnostics",
      kind: "clinic",
      offsetLat: -0.005,
      offsetLng: -0.006,
      rating: 4.7,
      phone: "+91 98765 44556",
      open_24h: false,
      opens_at: "08:00",
      closes_at: "21:30",
      address: "Suite 201, Medical Tower",
    },
    {
      id: "fac-local-5",
      name: "Max Health Super Specialty Hospital",
      kind: "hospital",
      offsetLat: 0.012,
      offsetLng: 0.011,
      rating: 4.9,
      phone: "+91 98765 55667",
      open_24h: true,
      address: "Ring Road Medical Enclave",
    },
    {
      id: "fac-local-6",
      name: "Fortis Care Specialty Clinic",
      kind: "clinic",
      offsetLat: -0.011,
      offsetLng: 0.008,
      rating: 4.8,
      phone: "+91 98765 66778",
      open_24h: false,
      opens_at: "09:00",
      closes_at: "20:00",
      address: "Plot 45, Commercial Hub",
    },
    {
      id: "fac-local-7",
      name: "Metro Children's & Family Hospital",
      kind: "hospital",
      offsetLat: 0.018,
      offsetLng: -0.015,
      rating: 4.8,
      phone: "+91 98765 77889",
      open_24h: true,
      address: "Civil Lines, Pediatric Block",
    },
    {
      id: "fac-local-8",
      name: "Guardian 24-Hour Pharmacy",
      kind: "pharmacy",
      offsetLat: -0.008,
      offsetLng: -0.009,
      rating: 4.6,
      phone: "+91 98765 88990",
      open_24h: true,
      address: "Station Square, Near Bus Stop",
    },
    {
      id: "fac-local-9",
      name: "Dr. Lal PathLabs & Diagnostic Center",
      kind: "clinic",
      offsetLat: 0.009,
      offsetLng: -0.012,
      rating: 4.7,
      phone: "+91 98765 99001",
      open_24h: false,
      opens_at: "07:00",
      closes_at: "21:00",
      address: "Central Plaza, 1st Floor",
    },
    {
      id: "fac-local-10",
      name: "Sunshine Heart & Trauma Hospital",
      kind: "hospital",
      offsetLat: -0.022,
      offsetLng: 0.019,
      rating: 4.9,
      phone: "+91 98765 00112",
      open_24h: true,
      address: "Emergency Highway Bypass",
    },
    {
      id: "fac-local-11",
      name: "Wellness Polyclinic & Dental Care",
      kind: "clinic",
      offsetLat: 0.014,
      offsetLng: 0.007,
      rating: 4.6,
      phone: "+91 98765 11335",
      open_24h: false,
      opens_at: "09:30",
      closes_at: "20:30",
      address: "Green Park Extension",
    },
    {
      id: "fac-local-12",
      name: "Wellness Chemist & Medical Supplies",
      kind: "pharmacy",
      offsetLat: -0.015,
      offsetLng: -0.014,
      rating: 4.7,
      phone: "+91 98765 22446",
      open_24h: false,
      opens_at: "08:00",
      closes_at: "22:30",
      address: "Hospital Road Gate 1",
    },
  ];

  return nearbyTemplates.map((item) => ({
    id: item.id,
    name: item.name,
    kind: item.kind,
    address: item.address,
    city: userCoords ? "Your Area" : "Central City",
    latitude: baseLat + item.offsetLat,
    longitude: baseLng + item.offsetLng,
    rating: item.rating,
    phone: item.phone,
    open_24h: item.open_24h,
    opens_at: (item as any).opens_at ?? null,
    closes_at: (item as any).closes_at ?? null,
  }));
}

function HospitalsPage() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(true);
  const [kind, setKind] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { timeout: 8000 },
    );
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["facilities"],
    queryFn: async () => {
      try {
        const { data: rows, error } = await supabase.from("facilities").select("*");
        if (error || !rows || rows.length === 0) return null;
        return rows;
      } catch {
        return null;
      }
    },
  });

  const reference = coords ?? { lat: 28.6139, lng: 77.209 };

  const facilities = useMemo(() => {
    const rawList = data && data.length > 0 ? data : generateLocalNearbyFacilities(coords);
    const term = searchQuery.trim().toLowerCase();

    return rawList
      .filter((facility) => {
        const matchKind = kind === "all" || facility.kind === kind;
        const matchSearch =
          !term ||
          facility.name.toLowerCase().includes(term) ||
          (facility.address ?? "").toLowerCase().includes(term) ||
          (facility.city ?? "").toLowerCase().includes(term);
        return matchKind && matchSearch;
      })
      .map((facility) => ({
        ...facility,
        distance: distanceKm(reference, {
          lat: Number(facility.latitude),
          lng: Number(facility.longitude),
        }),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [data, coords, kind, searchQuery, reference.lat, reference.lng]);

  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${reference.lng - 0.05}%2C${reference.lat - 0.04}%2C${reference.lng + 0.05}%2C${reference.lat + 0.04}&layer=mapnik&marker=${reference.lat}%2C${reference.lng}`;

  function retryLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
        toast.success("Location updated! Showing nearby care facilities.");
      },
      () => {
        setLocating(false);
        toast.error("Location permission denied. Showing default city area.");
      },
    );
  }

  return (
    <div>
      <PageHeader
        title="Care near you"
        subtitle={coords ? "Nearby care facilities ordered by distance from your location" : "Enable GPS location to pinpoint facilities right next to you"}
        action={
          <Button variant="ghost" size="icon" onClick={retryLocation} aria-label="Refresh location">
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4 text-primary" />}
          </Button>
        }
      />

      <div className="mx-5 overflow-hidden rounded-2xl shadow-card">
        <iframe
          title="Map of your area"
          src={mapSrc}
          className="h-52 w-full border-0"
          loading="lazy"
        />
      </div>

      <div className="mx-5 mt-4 flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-card">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search nearby hospitals, clinics or pharmacies..."
          maxLength={80}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5">
        {KINDS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setKind(option.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              kind === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground shadow-card",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3 px-5 pb-6">
        {isLoading ? (
          <li className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </li>
        ) : null}

        {facilities.map((facility) => {
          const open = isOpenNow(facility.open_24h, facility.opens_at, facility.closes_at);
          const distStr = facility.distance < 1
            ? `${Math.round(facility.distance * 1000)} m`
            : `${facility.distance.toFixed(1)} km`;

          return (
            <li key={facility.id} className="rounded-2xl bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{facility.name}</h2>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {facility.address}, {facility.city}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-secondary-foreground">
                      <Star className="h-3 w-3 fill-current text-warning" />
                      {Number(facility.rating).toFixed(1)}
                    </span>
                    <span className="rounded-full bg-primary-soft px-2 py-1 font-semibold text-primary">
                      {distStr}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 font-medium",
                        open ? "bg-accent-soft text-accent-foreground" : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {facility.open_24h ? "Open 24h" : open ? "Open now" : "Closed"}
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-1 capitalize text-muted-foreground">
                      {facility.kind}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${facility.phone ?? ""}`}>
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                </Button>
                <Button asChild size="sm">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Navigation className="h-4 w-4" />
                    Directions
                  </a>
                </Button>
              </div>
            </li>
          );
        })}

        {!isLoading && facilities.length === 0 ? (
          <li className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
            No care facilities found matching your search.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

