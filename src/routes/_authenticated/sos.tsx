import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Ambulance, Loader2, MapPin, MessageSquare, Phone, Plus, Siren, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/sos")({
  head: () => ({
    meta: [
      { title: "Emergency SOS — MediGuide AI" },
      { name: "description", content: "One-tap ambulance calling, emergency contacts and instant location sharing when every second counts." },
      { property: "og:title", content: "Emergency SOS — MediGuide AI" },
      { property: "og:description", content: "One-tap ambulance call, emergency contacts and location sharing." },
    ],
  }),
  component: SosPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  phone: z.string().trim().min(5, "Phone is required").max(25),
  relationship: z.string().trim().max(40).optional(),
});

function SosPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [locating, setLocating] = useState(false);

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["emergency-contacts", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ name, phone, relationship });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const { error } = await supabase.from("emergency_contacts").insert({
        user_id: user!.id,
        name: parsed.data.name,
        phone: parsed.data.phone,
        relationship: parsed.data.relationship || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contact added");
      setName("");
      setPhone("");
      setRelationship("");
      queryClient.invalidateQueries({ queryKey: ["emergency-contacts", user?.id] });
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emergency-contacts", user?.id] }),
  });

  function shareLocation(contactPhone?: string) {
    if (!("geolocation" in navigator)) return toast.error("Location is not available on this device.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const link = `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`;
        const message = `Emergency! I need help. My location: ${link}`;
        if (contactPhone) {
          window.location.href = `sms:${contactPhone}?&body=${encodeURIComponent(message)}`;
          return;
        }
        void navigator.clipboard?.writeText(message);
        toast.success("Location link copied — paste it to anyone who can help.");
      },
      () => {
        setLocating(false);
        toast.error("Could not get your location. Allow location access and try again.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div>
      <PageHeader title="Emergency SOS" subtitle="Get help fast and share where you are." />

      <section className="mx-5 space-y-3">
        <a
          href="tel:999"
          className="flex items-center gap-4 rounded-3xl bg-destructive px-5 py-6 text-destructive-foreground shadow-card"
        >
          <Siren className="h-9 w-9" />
          <span>
            <span className="block text-lg font-semibold">Call emergency services</span>
            <span className="block text-sm opacity-90">Dials your national emergency number</span>
          </span>
        </a>

        <div className="grid grid-cols-2 gap-3">
          <Button asChild variant="outline" className="h-auto flex-col gap-1 py-4">
            <a href="tel:199">
              <Ambulance className="h-5 w-5 text-destructive" />
              <span className="text-xs">Ambulance</span>
            </a>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-1 py-4"
            onClick={() => shareLocation()}
            disabled={locating}
          >
            {locating ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <MapPin className="h-5 w-5 text-primary" />
            )}
            <span className="text-xs">Share location</span>
          </Button>
        </div>
      </section>

      <section className="mt-6 px-5">
        <h2 className="text-sm font-semibold text-foreground">Emergency contacts</h2>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : null}
        {!isLoading && (contacts?.length ?? 0) === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Add the people who should be contacted in an emergency.
          </p>
        ) : null}

        <ul className="mt-3 space-y-3">
          {contacts?.map((contact) => (
            <li key={contact.id} className="rounded-2xl bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{contact.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {contact.phone}
                    {contact.relationship ? ` · ${contact.relationship}` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete contact"
                  onClick={() => remove.mutate(contact.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={`tel:${contact.phone}`}>
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                </Button>
                <Button size="sm" onClick={() => shareLocation(contact.phone)}>
                  <MessageSquare className="h-4 w-4" />
                  Send location
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-5 mt-6 mb-6 space-y-3 rounded-2xl bg-card p-4 shadow-card">
        <h2 className="text-sm font-semibold text-foreground">Add a contact</h2>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          maxLength={80}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Phone number"
          inputMode="tel"
          maxLength={25}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          value={relationship}
          onChange={(event) => setRelationship(event.target.value)}
          placeholder="Relationship (e.g. sister)"
          maxLength={40}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />
        <Button className="w-full" onClick={() => add.mutate()} disabled={add.isPending}>
          {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add contact
        </Button>
      </section>
    </div>
  );
}
