import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/records")({
  head: () => ({
    meta: [
      { title: "Health records — MediGuide AI" },
      { name: "description", content: "Store prescriptions, lab reports and scans securely in your private health record vault and download them any time." },
      { property: "og:title", content: "Health records — MediGuide AI" },
      { property: "og:description", content: "A private vault for prescriptions, lab reports and scans." },
    ],
  }),
  component: RecordsPage,
});

const TYPES = ["prescription", "lab_report", "scan", "other"] as const;

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  record_type: z.enum(TYPES),
  record_date: z.string().optional(),
  notes: z.string().trim().max(300).optional(),
});

function RecordsPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [recordType, setRecordType] = useState<(typeof TYPES)[number]>("prescription");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: records, isLoading } = useQuery({
    queryKey: ["records", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_records")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ title, record_type: recordType, record_date: recordDate, notes });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);

      let filePath: string | null = null;
      let fileName: string | null = null;

      if (file) {
        if (file.size > 10 * 1024 * 1024) throw new Error("File must be smaller than 10 MB");
        const safeName = file.name.replace(/[^\w.-]/g, "_");
        const path = `${user!.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("health-records")
          .upload(path, file);
        if (uploadError) throw uploadError;
        filePath = path;
        fileName = file.name;
      }

      const { error } = await supabase.from("health_records").insert({
        user_id: user!.id,
        title: parsed.data.title,
        record_type: parsed.data.record_type,
        record_date: parsed.data.record_date || null,
        notes: parsed.data.notes || null,
        file_path: filePath,
        file_name: fileName,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Record saved");
      setTitle("");
      setNotes("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["records", user?.id] });
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async ({ id, path }: { id: string; path: string | null }) => {
      if (path) await supabase.storage.from("health-records").remove([path]);
      const { error } = await supabase.from("health_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Record deleted");
      queryClient.invalidateQueries({ queryKey: ["records", user?.id] });
    },
    onError: (error) => toast.error(error.message),
  });

  async function openFile(path: string) {
    const { data, error } = await supabase.storage.from("health-records").createSignedUrl(path, 60);
    if (error || !data) return toast.error("Could not open the file");
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <div>
      <PageHeader title="Health records" subtitle="Private storage for prescriptions, reports and scans." />

      <section className="mx-5 space-y-3 rounded-2xl bg-card p-4 shadow-card">
        <h2 className="text-sm font-semibold text-foreground">Add a record</h2>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title (e.g. Blood test — March)"
          maxLength={120}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />

        <div className="grid grid-cols-4 gap-2">
          {TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setRecordType(type)}
              className={cn(
                "rounded-xl px-2 py-2 text-[11px] font-medium capitalize transition-colors",
                recordType === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {type.replace("_", " ")}
            </button>
          ))}
        </div>

        <input
          type="date"
          value={recordDate}
          onChange={(event) => setRecordDate(event.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />

        <input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes (optional)"
          maxLength={300}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />

        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-input px-3 py-3 text-sm text-muted-foreground">
          <Upload className="h-4 w-4" />
          {file ? file.name : "Attach a file (image or PDF, max 10 MB)"}
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Save record
        </Button>
      </section>

      <section className="mt-6 px-5 pb-6">
        <h2 className="text-sm font-semibold text-foreground">Saved records</h2>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : null}
        {!isLoading && (records?.length ?? 0) === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">Nothing stored yet.</p>
        ) : null}

        <ul className="mt-3 space-y-3">
          {records?.map((record) => (
            <li key={record.id} className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{record.title}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {record.record_type.replace("_", " ")}
                  {record.record_date ? ` · ${record.record_date}` : ""}
                </p>
                {record.notes ? (
                  <p className="mt-1 text-xs text-muted-foreground">{record.notes}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1">
                {record.file_path ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open file"
                    onClick={() => openFile(record.file_path!)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete record"
                  onClick={() => remove.mutate({ id: record.id, path: record.file_path })}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
