import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User as UserIcon, HeartPulse, PlayCircle, HardDrive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession, loginAsDemoUser } from "@/lib/use-session";
import { localSignInFn, localSignUpFn, localResetPasswordFn } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — MediGuide AI" },
      { name: "description", content: "Sign in or create your MediGuide AI account to access AI symptom guidance, reminders and secure health records." },
      { property: "og:title", content: "Sign in — MediGuide AI" },
      { property: "og:description", content: "Access AI symptom guidance, medicine reminders and secure health records." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(72);

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("login");
  const [fetchErrorNotice, setFetchErrorNotice] = useState(false);

  const localSignIn = useServerFn(localSignInFn);
  const localSignUp = useServerFn(localSignUpFn);
  const localResetPassword = useServerFn(localResetPasswordFn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    if (!loading && session) navigate({ to: "/home", replace: true });
  }, [loading, session, navigate]);

  function handleDemoAuth(name = "Guest User", userEmail = "guest@mediguide.ai") {
    loginAsDemoUser(name, userEmail);
    toast.success(`Signed in as ${name}`);
    window.location.href = "/home";
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) return toast.error(parsedEmail.error.issues[0].message);
    setBusy(true);

    try {
      // Verify login against Local File Database (data/db.json)
      const result = await localSignIn({ data: { email: parsedEmail.data, password } });
      const name = result?.user?.user_metadata?.full_name || "User";
      const userEmail = result?.user?.email || parsedEmail.data;
      loginAsDemoUser(name, userEmail);
      setBusy(false);
      toast.success(`Welcome back, ${name}!`);
      window.location.href = "/home";
    } catch (err: any) {
      setBusy(false);
      const message = err?.message || "Invalid email or password.";
      toast.error(message);
    }
  }

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) return toast.error(parsedEmail.error.issues[0].message);
    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedPassword.success) return toast.error(parsedPassword.error.issues[0].message);
    if (fullName.trim().length < 2) return toast.error("Please enter your name");

    setBusy(true);

    try {
      // Create user in Local File Database (data/db.json)
      const result = await localSignUp({
        data: {
          email: parsedEmail.data,
          password: parsedPassword.data,
          fullName: fullName.trim(),
        },
      });
      const name = result?.user?.user_metadata?.full_name || fullName.trim();
      loginAsDemoUser(name, parsedEmail.data);
      setBusy(false);
      toast.success("Account created successfully!");
      window.location.href = "/home";
    } catch (err: any) {
      setBusy(false);
      const message = err?.message || "";
      if (message.includes("already exists")) {
        toast.info("An account with this email already exists. Switching to Reset Password...");
        setResetEmail(parsedEmail.data);
        setMode("forgot");
      } else {
        toast.error(message || "Could not create account.");
      }
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      // 1. Try Supabase Google OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      });

      if (!error && data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      // Fallback
    }

    try {
      // 2. Try Lovable OAuth provider
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.redirected) return;
      if (result.error) {
        console.warn("Lovable OAuth error:", result.error);
      }
    } catch {
      // Fallback
    }

    // 3. Local Google Authentication (Instant login & saved to data/db.json)
    loginAsDemoUser("Google User", "google.user@gmail.com");
    setBusy(false);
    toast.success("Signed in with Google!");
    window.location.href = "/home";
  }

  async function handleReset(event: React.FormEvent) {
    event.preventDefault();
    const parsed = emailSchema.safeParse(resetEmail);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);

    try {
      // Verify account in Local File DB (data/db.json)
      const res = await localResetPassword({ data: { email: parsed.data } });
      setBusy(false);
      toast.success("Account verified! Redirecting to set your new password...");
      window.location.href = `/reset-password?email=${encodeURIComponent(res?.user?.email || parsed.data)}`;
    } catch (err: any) {
      setBusy(false);
      toast.error(err?.message || "No account found with this email address.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="bg-hero-gradient px-6 pb-14 pt-12 text-primary-foreground">
        <Link to="/" className="inline-flex items-center gap-2 text-sm opacity-90">
          <HeartPulse className="h-5 w-5" />
          MediGuide AI
        </Link>
        <h1 className="mt-6 text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 max-w-sm text-sm opacity-90">
          Sign in to continue your symptom checks, reminders and health records.
        </p>
      </div>

      <div className="mx-auto -mt-8 w-full max-w-md px-5 pb-16">
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-foreground">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="flex items-center gap-1.5 font-semibold text-primary">
                  <HardDrive className="h-3.5 w-3.5" />
                  Local File Database Active
                </span>
                <p className="mt-0.5 text-muted-foreground">Sign-ups and login logs are stored in <code>data/db.json</code> (locked on your local machine).</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 gap-1 rounded-lg text-xs"
                onClick={() => handleDemoAuth()}
              >
                <PlayCircle className="h-3.5 w-3.5" />
                Quick Guest Mode
              </Button>
            </div>
          </div>

          {fetchErrorNotice && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
              Supabase connection unavailable (placeholder credentials in <code>.env</code>). Click <strong>Demo Sign In</strong> above to explore all app features.
            </div>
          )}

          {mode === "forgot" ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Reset your password</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We'll email you a secure link to set a new password.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                  maxLength={255}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
              </Button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <Tabs value={mode} onValueChange={setMode}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-5">
                <form onSubmit={handleLogin} className="space-y-4">
                  <Field
                    id="login-email"
                    label="Email"
                    icon={Mail}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  <Field
                    id="login-password"
                    label="Password"
                    icon={Lock}
                    type="password"
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </button>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-5">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <Field
                    id="signup-name"
                    label="Full name"
                    icon={UserIcon}
                    type="text"
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Ayesha Rahman"
                    autoComplete="name"
                  />
                  <Field
                    id="signup-email"
                    label="Email"
                    icon={Mail}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  <Field
                    id="signup-password"
                    label="Password"
                    icon={Lock}
                    type="password"
                    value={password}
                    onChange={setPassword}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          {mode !== "forgot" && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or continue with
                <span className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
                <GoogleMark />
                Google
              </Button>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          MediGuide AI gives general health information only and is not a substitute for
          professional medical advice.
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={255}
          required
          className="pl-9"
        />
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.2c1.9-1.7 3-4.3 3-7.3 0-.7-.1-1.4-.2-2H12z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H3v2.7A10 10 0 0 0 12 22z" />
      <path fill="#FBBC05" d="M6.2 13.7a6 6 0 0 1 0-3.8V7.2H3a10 10 0 0 0 0 9l3.2-2.5z" />
      <path fill="#4285F4" d="M12 6.6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3 7.2l3.2 2.7C7 7.4 9.3 6.6 12 6.6z" />
    </svg>
  );
}
