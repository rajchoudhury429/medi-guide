import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { BellRing, Check, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/reminders")({
  head: () => ({
    meta: [
      { title: "Medicine reminders — MediGuide AI" },
      { name: "description", content: "Set daily medicine reminders with dosage and multiple times, then mark each dose as taken or skipped." },
      { property: "og:title", content: "Medicine reminders — MediGuide AI" },
      { property: "og:description", content: "Daily medicine schedules with taken/skipped tracking." },
    ],
  }),
  component: RemindersPage,
});

const schema = z.object({
  medicine_name: z.string().trim().min(1, "Medicine name is required").max(100),
  dosage: z.string().trim().max(60).optional(),
  times: z.array(z.string()).min(1, "Add at least one time"),
  notes: z.string().trim().max(200).optional(),
});

function RemindersPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [notes, setNotes] = useState("");
  const [times, setTimes] = useState<string[]>(["08:00"]);

  const { data: reminders, isLoading } = useQuery({
    queryKey: ["reminders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicine_reminders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: logs } = useQuery({
    queryKey: ["reminder-logs", user?.id, today],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminder_logs")
        .select("*")
        .gte("taken_at", `${today}T00:00:00Z`);
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ medicine_name: name, dosage, times, notes });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const { error } = await supabase.from("medicine_reminders").insert({
        user_id: user!.id,
        medicine_name: parsed.data.medicine_name,
        dosage: parsed.data.dosage || null,
        notes: parsed.data.notes || null,
        times: parsed.data.times,
        start_date: today,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reminder added");
      setName("");
      setDosage("");
      setNotes("");
      setTimes(["08:00"]);
      queryClient.invalidateQueries({ queryKey: ["reminders", user?.id] });
    },
    onError: (error) => toast.error(error.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("medicine_reminders").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders", user?.id] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("medicine_reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reminder deleted");
      queryClient.invalidateQueries({ queryKey: ["reminders", user?.id] });
    },
  });

  const log = useMutation({
    mutationFn: async ({
      reminderId,
      scheduledTime,
      status,
    }: {
      reminderId: string;
      scheduledTime: string;
      status: "taken" | "skipped";
    }) => {
      const { error } = await supabase.from("reminder_logs").insert({
        user_id: user!.id,
        reminder_id: reminderId,
        scheduled_time: scheduledTime,
        status,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminder-logs", user?.id, today] }),
    onError: (error) => toast.error(error.message),
  });

  function statusFor(reminderId: string, time: string) {
    return logs?.find(
      (item) => item.reminder_id === reminderId && item.scheduled_time.slice(0, 5) === time,
    )?.status;
  }

  return (
    <div>
      <PageHeader title="Medicine reminders" subtitle="Daily schedules with taken and skipped tracking." />

      <section className="mx-5 space-y-3 rounded-2xl bg-card p-4 shadow-card">
        <h2 className="text-sm font-semibold text-foreground">New reminder</h2>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Medicine name"
          maxLength={100}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          value={dosage}
          onChange={(event) => setDosage(event.target.value)}
          placeholder="Dosage (e.g. 1 tablet, 500 mg)"
          maxLength={60}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Times</p>
          {times.map((value, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="time"
                value={value}
                onChange={(event) =>
                  setTimes(times.map((item, i) => (i === index ? event.target.value : item)))
                }
                className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
              {times.length > 1 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove time"
                  onClick={() => setTimes(times.filter((_, i) => i !== index))}
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setTimes([...times, "20:00"])}>
            <Plus className="h-4 w-4" />
            Add time
          </Button>
        </div>

        <input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes (e.g. after food)"
          maxLength={200}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />

        <Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending}>
          {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
          Save reminder
        </Button>
      </section>

      <section className="mt-6 px-5 pb-6">
        <h2 className="text-sm font-semibold text-foreground">Your reminders</h2>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : null}
        {!isLoading && (reminders?.length ?? 0) === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">No reminders yet.</p>
        ) : null}

        <ul className="mt-3 space-y-3">
          {reminders?.map((reminder) => (
            <li key={reminder.id} className="rounded-2xl bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{reminder.medicine_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {reminder.dosage ?? "—"}
                    {reminder.notes ? ` · ${reminder.notes}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={reminder.active}
                    onCheckedChange={(checked) =>
                      toggleActive.mutate({ id: reminder.id, active: checked })
                    }
                    aria-label="Toggle reminder"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete reminder"
                    onClick={() => remove.mutate(reminder.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {reminder.times.map((time) => {
                  const status = statusFor(reminder.id, time.slice(0, 5));
                  return (
                    <div
                      key={time}
                      className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2"
                    >
                      <span className="text-xs font-medium text-secondary-foreground">
                        {time.slice(0, 5)}
                      </span>
                      {status ? (
                        <span className="text-xs capitalize text-muted-foreground">{status}</span>
                      ) : (
                        <span className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              log.mutate({
                                reminderId: reminder.id,
                                scheduledTime: time.slice(0, 5),
                                status: "taken",
                              })
                            }
                          >
                            <Check className="h-4 w-4 text-accent" />
                            Taken
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              log.mutate({
                                reminderId: reminder.id,
                                scheduledTime: time.slice(0, 5),
                                status: "skipped",
                              })
                            }
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                            Skip
                          </Button>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
