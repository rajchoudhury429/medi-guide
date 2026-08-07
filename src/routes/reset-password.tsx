import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — MediGuide AI" },
      { name: "description", content: "Choose a new password for your MediGuide AI account." },
      { property: "og:title", content: "Set a new password — MediGuide AI" },
      { property: "og:description", content: "Choose a new password for your MediGuide AI account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(72);

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (password !== confirm) return toast.error("Passwords do not match");

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/home", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-3xl bg-card p-6 shadow-card">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Open this page from the reset link in your email.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
        </Button>
      </form>
    </div>
  );
}
