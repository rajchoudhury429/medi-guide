import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CalendarDays, Clock, Loader2, Trash2, Stethoscope, CheckCircle, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { bookAppointmentFn, getAppointmentsFn, cancelAppointmentFn } from "@/lib/user.functions";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ doctorId: z.string().optional() });

export const Route = createFileRoute("/_authenticated/appointments")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Appointments — Medi guide AI" },
      { name: "description", content: "Book doctor appointments with date and time slots, then track upcoming and past visits in one place." },
      { property: "og:title", content: "Appointments — Medi guide AI" },
      { property: "og:description", content: "Book and track your doctor appointments." },
    ],
  }),
  component: AppointmentsPage,
});

const SLOTS = ["09:00 AM", "10:30 AM", "11:30 AM", "02:00 PM", "03:30 PM", "05:00 PM", "06:30 PM", "08:00 PM"];

const MOCK_DOCTORS = [
  { id: "doc-1", name: "Dr. Ananya Sharma", specialty: "Cardiologist", experience: "12 yrs exp", rating: "4.9", clinic: "City Heart Center" },
  { id: "doc-2", name: "Dr. Rajesh Verma", specialty: "General Physician", experience: "15 yrs exp", rating: "4.8", clinic: "Care Polyclinic" },
  { id: "doc-3", name: "Dr. Meera Nambiar", specialty: "Dermatologist", experience: "9 yrs exp", rating: "4.9", clinic: "Skin & Laser Care" },
  { id: "doc-4", name: "Dr. Vikram Sethi", specialty: "Neurologist", experience: "18 yrs exp", rating: "5.0", clinic: "Brain & Spine Institute" },
  { id: "doc-5", name: "Dr. Kavita Reddy", specialty: "Pediatrician", experience: "11 yrs exp", rating: "4.8", clinic: "Little Stars Children Hospital" },
  { id: "doc-6", name: "Dr. Suresh Nair", specialty: "Orthopedic Surgeon", experience: "14 yrs exp", rating: "4.7", clinic: "Bone & Joint Hospital" },
];

const formSchema = z.object({
  doctorId: z.string().min(1, "Choose a doctor"),
  date: z.string().min(1, "Choose a date"),
  time: z.string().min(1, "Choose a time slot"),
  reason: z.string().trim().max(300).optional(),
});

function AppointmentsPage() {
  const { doctorId } = Route.useSearch();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const bookServer = useServerFn(bookAppointmentFn);
  const getAppointmentsServer = useServerFn(getAppointmentsFn);
  const cancelServer = useServerFn(cancelAppointmentFn);

  const [selectedDoctor, setSelectedDoctor] = useState(doctorId ?? "");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (doctorId) setSelectedDoctor(doctorId);
  }, [doctorId]);

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("doctors").select("*").order("name");
        if (error || !data || data.length === 0) return MOCK_DOCTORS;
        return data;
      } catch {
        return MOCK_DOCTORS;
      }
    },
  });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      try {
        if (!user?.id) return [];
        // Fetch from local file DB server function
        const res = await getAppointmentsServer({ data: { userId: user.id } });
        if (res && res.length > 0) return res;

        // Supabase fallback
        const { data } = await supabase
          .from("appointments")
          .select("*")
          .order("appointment_date", { ascending: true });
        return data ?? [];
      } catch {
        return [];
      }
    },
  });

  const book = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("You must be logged in to book an appointment.");
      const parsed = formSchema.safeParse({ doctorId: selectedDoctor, date, time, reason });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);

      const doctorList = doctors || MOCK_DOCTORS;
      const doctor = doctorList.find((item) => item.id === parsed.data.doctorId);
      if (!doctor) throw new Error("Please select a valid doctor from the list.");

      // Book persistently in local file database
      await bookServer({
        data: {
          userId: user.id,
          doctorId: doctor.id,
          doctorName: doctor.name,
          specialty: doctor.specialty,
          appointmentDate: parsed.data.date,
          appointmentTime: parsed.data.time,
          reason: parsed.data.reason || undefined,
        },
      });

      // Try Supabase insert as backup
      try {
        await supabase.from("appointments").insert({
          user_id: user.id,
          doctor_id: doctor.id,
          doctor_name: doctor.name,
          specialty: doctor.specialty,
          appointment_date: parsed.data.date,
          appointment_time: parsed.data.time,
          reason: parsed.data.reason || null,
        });
      } catch {
        // ignore Supabase error
      }
    },
    onSuccess: () => {
      toast.success("Appointment booked successfully!");
      setTime("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["appointments", user?.id] });
    },
    onError: (error) => toast.error(error.message),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) return;
      await cancelServer({ data: { userId: user.id, appointmentId: id } });

      try {
        await supabase
          .from("appointments")
          .update({ status: "cancelled" })
          .eq("id", id);
      } catch {
        // ignore
      }
    },
    onSuccess: () => {
      toast.success("Appointment cancelled");
      queryClient.invalidateQueries({ queryKey: ["appointments", user?.id] });
    },
    onError: (error) => toast.error(error.message),
  });

  const upcoming = (appointments ?? []).filter(
    (item) => item.appointment_date >= today && item.status !== "cancelled",
  );
  const past = (appointments ?? []).filter(
    (item) => item.appointment_date < today || item.status === "cancelled",
  );

  const activeDoctorInfo = (doctors || MOCK_DOCTORS).find((d) => d.id === selectedDoctor);

  return (
    <div className="pb-8">
      <PageHeader title="Doctor Appointments" subtitle="Book visits with specialist doctors & manage your appointment schedule." />

      {/* Appointment Booking Form */}
      <section className="mx-5 space-y-4 rounded-2xl bg-card p-4.5 shadow-card border border-border/40">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Book a New Consultation</h2>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
            <CheckCircle className="h-3 w-3" /> Guaranteed Slot
          </span>
        </div>

        {/* Doctor Selection */}
        <label className="block text-xs font-medium text-muted-foreground space-y-1">
          <span>Select Specialist Doctor</span>
          <select
            value={selectedDoctor}
            onChange={(event) => setSelectedDoctor(event.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground font-medium"
          >
            <option value="">-- Choose Doctor & Specialty --</option>
            {(doctors || MOCK_DOCTORS).map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} ({doctor.specialty}) — ⭐ {doctor.rating || "4.8"}
              </option>
            ))}
          </select>
        </label>

        {activeDoctorInfo ? (
          <div className="flex items-center gap-3 rounded-xl bg-secondary p-3 text-xs border border-border/40">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary font-bold">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-foreground">{activeDoctorInfo.name}</p>
              <p className="text-muted-foreground">{activeDoctorInfo.specialty} · {(activeDoctorInfo as any).clinic || "Medical Specialist"}</p>
            </div>
          </div>
        ) : null}

        {/* Date Selection */}
        <label className="block text-xs font-medium text-muted-foreground space-y-1">
          <span>Consultation Date</span>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground font-medium"
          />
        </label>

        {/* Time Slot Selector */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">Select Preferred Time Slot</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setTime(slot)}
                className={cn(
                  "rounded-xl px-2 py-2 text-xs font-semibold transition-all border",
                  time === slot
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-secondary text-foreground border-border/40 hover:bg-card",
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Symptoms / Reason Textarea */}
        <label className="block text-xs font-medium text-muted-foreground space-y-1">
          <span>Reason for Visit / Symptoms (Optional)</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={300}
            rows={2}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="e.g. Follow-up consultation for persistent headaches or routine health checkup"
          />
        </label>

        <Button className="w-full rounded-xl font-semibold gap-2" size="lg" onClick={() => book.mutate()} disabled={book.isPending}>
          {book.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
          Confirm & Book Appointment
        </Button>
      </section>

      {/* Upcoming Appointments List */}
      <section className="mt-6 px-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Upcoming Scheduled Visits ({upcoming.length})
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : null}

        {!isLoading && upcoming.length === 0 ? (
          <div className="mt-2.5 rounded-2xl bg-card p-5 text-center text-xs text-muted-foreground shadow-card border border-border/40">
            No upcoming appointments scheduled yet. Select a doctor above to book your first visit.
          </div>
        ) : null}

        <ul className="mt-3 space-y-3">
          {upcoming.map((item) => (
            <li key={item.id} className="rounded-2xl bg-card p-4 shadow-card border border-border/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{item.doctor_name}</p>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 capitalize">
                      {item.status || "Confirmed"}
                    </span>
                  </div>
                  <p className="flex items-center gap-1 text-xs font-semibold text-primary mt-0.5">
                    <Stethoscope className="h-3.5 w-3.5" />
                    {item.specialty}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    {item.appointment_date} at {item.appointment_time}
                  </p>
                  {item.reason ? (
                    <p className="mt-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1.5 rounded-lg border border-border/30">
                      Note: {item.reason}
                    </p>
                  ) : null}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Cancel appointment"
                  onClick={() => cancel.mutate(item.id)}
                  className="rounded-xl text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Past & Cancelled Appointments */}
      {past.length > 0 ? (
        <section className="mt-6 px-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Past & Cancelled Visits</h2>
          <ul className="mt-2.5 space-y-2">
            {past.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 text-xs shadow-card border border-border/40"
              >
                <div>
                  <span className="font-semibold text-foreground">{item.doctor_name}</span>
                  <span className="text-muted-foreground"> ({item.specialty}) · {item.appointment_date}</span>
                </div>
                <span className={`capitalize font-semibold px-2 py-0.5 rounded-full text-[10px] ${item.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground'}`}>
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

