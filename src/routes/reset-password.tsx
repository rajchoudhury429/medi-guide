import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { localResetPasswordFn } from "@/lib/auth.functions";
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
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const [targetEmail, setTargetEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const localResetPassword = useServerFn(localResetPasswordFn);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const emailToUse = targetEmail.trim();
    if (!emailToUse) return toast.error("Please enter your account email.");
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (password !== confirm) return toast.error("Passwords do not match");

    setBusy(true);

    try {
      // 1. Reset password in Local File Database (data/db.json)
      await localResetPassword({ data: { email: emailToUse, newPassword: parsed.data } });
      setBusy(false);
      toast.success("Password updated successfully! Please sign in with your new password.");
      window.location.href = "/auth";
    } catch (err: any) {
      try {
        const { error } = await supabase.auth.updateUser({ password: parsed.data });
        setBusy(false);
        if (error) return toast.error(err?.message || error.message);
        toast.success("Password updated successfully!");
        window.location.href = "/home";
      } catch {
        setBusy(false);
        toast.error(err?.message || "Could not update password.");
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-3xl bg-card p-6 shadow-card">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Set new password</h1>
            <p className="text-xs text-muted-foreground">Enter your new password below</p>
          </div>
        </div>

        {!searchParams.get("email") && (
          <div className="space-y-2">
            <Label htmlFor="account-email">Account Email</Label>
            <Input
              id="account-email"
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter new password"
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
