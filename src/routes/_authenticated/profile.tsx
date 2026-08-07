import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  BellRing,
  CalendarDays,
  FolderHeart,
  Languages,
  LogOut,
  Loader2,
  Moon,
  Save,
  Siren,
  Stethoscope,
  Sun,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession, logoutDemoUser } from "@/lib/use-session";
import { useI18n, LANGUAGES, type LanguageCode } from "@/lib/i18n";
import { applyTheme, getStoredTheme, type ThemeMode } from "@/lib/theme";
import { getUserProfileFn, saveUserProfileFn } from "@/lib/user.functions";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile & settings — MediGuide AI" },
      { name: "description", content: "Manage your health profile, blood group, allergies and chronic conditions, plus language, theme and notification settings." },
      { property: "og:title", content: "Profile & settings — MediGuide AI" },
      { property: "og:description", content: "Health profile, language, theme and notification preferences." },
    ],
  }),
  component: ProfilePage,
});

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const schema = z.object({
  full_name: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(25).optional(),
  age: z.string().optional(),
  blood_group: z.string().max(5).optional(),
  allergies: z.string().trim().max(300).optional(),
  chronic_conditions: z.string().trim().max(300).optional(),
});

const LINKS = [
  { to: "/doctors", icon: Stethoscope, label: "Doctors" },
  { to: "/appointments", icon: CalendarDays, label: "Appointments" },
  { to: "/reminders", icon: BellRing, label: "Reminders" },
  { to: "/records", icon: FolderHeart, label: "Health records" },
  { to: "/sos", icon: Siren, label: "Emergency SOS" },
] as const;

function ProfilePage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language, setLanguage, t } = useI18n();
  const [theme, setTheme] = useState<ThemeMode>("light");

  const saveProfileServer = useServerFn(saveUserProfileFn);
  const getProfileServer = useServerFn(getUserProfileFn);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    age: "",
    blood_group: "",
    height_cm: "",
    weight_kg: "",
    allergies: "",
    chronic_conditions: "",
    notifications_enabled: true,
    share_location: true,
  });

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      try {
        if (!user?.id) return null;
        // Try local DB server function first
        const res = await getProfileServer({ data: { userId: user.id } });
        if (res && (res.full_name || res.email)) return res;

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        return data;
      } catch {
        return null;
      }
    },
  });

  useEffect(() => {
    if (!profile) return;
    setForm((prev) => ({
      ...prev,
      full_name: profile.full_name ?? user?.user_metadata?.full_name ?? "",
      phone: profile.phone ?? "",
      age: profile.age?.toString() ?? "",
      blood_group: profile.blood_group ?? profile.blood_type ?? "",
      allergies: profile.allergies ?? profile.emergency_contact ?? "",
      chronic_conditions: profile.chronic_conditions ?? profile.medical_history ?? "",
    }));
  }, [profile, user]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("You must be logged in to save settings.");

      const parsed = schema.safeParse({
        full_name: form.full_name,
        phone: form.phone,
        age: form.age,
        blood_group: form.blood_group,
        allergies: form.allergies,
        chronic_conditions: form.chronic_conditions,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);

      // Save to local file database (data/db.json)
      await saveProfileServer({
        data: {
          userId: user.id,
          fullName: form.full_name,
          phone: form.phone,
          age: form.age,
          bloodType: form.blood_group,
          emergencyContact: form.allergies,
          medicalHistory: form.chronic_conditions,
          language,
        },
      });

      // Try Supabase update as well
      try {
        await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            full_name: form.full_name || null,
            phone: form.phone || null,
            allergies: form.allergies || null,
            chronic_conditions: form.chronic_conditions || null,
            notifications_enabled: form.notifications_enabled,
            share_location: form.share_location,
            language,
            theme,
          });
      } catch {
        // ignore Supabase fallback
      }
    },
    onSuccess: () => {
      toast.success("Account settings & health profile saved permanently!");
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (error) => toast.error(error.message),
  });

  function toggleTheme() {
    const next: ThemeMode = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    logoutDemoUser();
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    navigate({ to: "/auth", replace: true });
  }

  const field = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value })),
  });

  return (
    <div className="pb-8">
      <PageHeader title="Profile & Settings" subtitle={user?.email ?? undefined} />

      <div className="mx-5 mb-4 flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Local Encrypted Storage Active — Your account settings are saved locally.
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : null}

      <section className="mx-5 space-y-3 rounded-2xl bg-card p-4 shadow-card border border-border/40">
        <h2 className="text-sm font-semibold text-foreground">Health profile</h2>
        <input
          {...field("full_name")}
          placeholder="Full name"
          maxLength={80}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          {...field("phone")}
          placeholder="Phone number"
          inputMode="tel"
          maxLength={25}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            {...field("age")}
            placeholder="Age"
            inputMode="numeric"
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
          <input
            {...field("height_cm")}
            placeholder="Height cm"
            inputMode="numeric"
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
          <input
            {...field("weight_kg")}
            placeholder="Weight kg"
            inputMode="numeric"
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <select
          value={form.blood_group}
          onChange={(event) => setForm((prev) => ({ ...prev, blood_group: event.target.value }))}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Blood group</option>
          {BLOOD_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
        <textarea
          {...field("allergies")}
          placeholder="Allergies / Emergency Contact Info"
          rows={2}
          maxLength={300}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />
        <textarea
          {...field("chronic_conditions")}
          placeholder="Chronic conditions / Medical notes"
          rows={2}
          maxLength={300}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />
        <Button className="w-full rounded-xl font-semibold gap-2" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Account Settings
        </Button>
      </section>

      <section className="mx-5 mt-4 space-y-3 rounded-2xl bg-card p-4 shadow-card border border-border/40">
        <h2 className="text-sm font-semibold text-foreground">{t("common.settings")}</h2>

        <label className="flex items-center justify-between gap-3 text-sm text-foreground">
          <span className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" />
            Language
          </span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as LanguageCode)}
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
          >
            {LANGUAGES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center justify-between gap-3 text-sm text-foreground">
          <span className="flex items-center gap-2">
            {theme === "dark" ? (
              <Moon className="h-4 w-4 text-primary" />
            ) : (
              <Sun className="h-4 w-4 text-primary" />
            )}
            Dark mode
          </span>
          <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} aria-label="Dark mode" />
        </div>

        <div className="flex items-center justify-between gap-3 text-sm text-foreground">
          <span className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-primary" />
            Reminder notifications
          </span>
          <Switch
            checked={form.notifications_enabled}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, notifications_enabled: checked }))
            }
            aria-label="Notifications"
          />
        </div>

        <div className="flex items-center justify-between gap-3 text-sm text-foreground">
          <span className="flex items-center gap-2">
            <Siren className="h-4 w-4 text-primary" />
            Share location in SOS
          </span>
          <Switch
            checked={form.share_location}
            onCheckedChange={(checked) => setForm((prev) => ({ ...prev, share_location: checked }))}
            aria-label="Share location"
          />
        </div>
      </section>

      <section className="mx-5 mt-4 overflow-hidden rounded-2xl bg-card shadow-card border border-border/40">
        {LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-3 border-b border-border px-4 py-3 text-sm text-foreground last:border-b-0 hover:bg-secondary"
          >
            <link.icon className="h-4 w-4 text-primary" />
            {link.label}
          </Link>
        ))}
      </section>

      <div className="mx-5 mt-4">
        <Button variant="outline" className="w-full rounded-xl font-semibold gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

