import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const DEMO_STORAGE_KEY = "mediguide_demo_user";

export const MOCK_USER: User = {
  id: "demo-user-0000-0000-000000000000",
  app_metadata: { provider: "email" },
  user_metadata: { full_name: "Ayesha Rahman" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: "demo@mediguide.ai",
  phone: "",
  role: "authenticated",
  updated_at: new Date().toISOString(),
};

export const MOCK_SESSION: Session = {
  access_token: "mock-access-token",
  token_type: "bearer",
  expires_in: 3600,
  refresh_token: "mock-refresh-token",
  user: MOCK_USER,
};

export function loginAsDemoUser(name = "Ayesha Rahman", email = "demo@mediguide.ai") {
  const customUser: User = {
    ...MOCK_USER,
    email,
    user_metadata: { full_name: name },
  };
  const customSession: Session = {
    ...MOCK_SESSION,
    user: customUser,
  };
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(customSession));
  window.dispatchEvent(new Event("mediguide-auth-change"));
}

export function logoutDemoUser() {
  localStorage.removeItem(DEMO_STORAGE_KEY);
  window.dispatchEvent(new Event("mediguide-auth-change"));
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function checkDemoSession(): Session | null {
      try {
        const stored = localStorage.getItem(DEMO_STORAGE_KEY);
        if (stored) return JSON.parse(stored) as Session;
      } catch {
        // ignore JSON parse error
      }
      return null;
    }

    let isMounted = true;

    const demo = checkDemoSession();
    if (demo) {
      setSession(demo);
      setLoading(false);
    }

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!isMounted) return;
      if (next) {
        setSession(next);
      } else {
        const currentDemo = checkDemoSession();
        setSession(currentDemo);
      }
      setLoading(false);
    });

    try {
      supabase.auth
        .getSession()
        .then(({ data: got }) => {
          if (!isMounted) return;
          if (got?.session) {
            setSession(got.session);
          } else {
            const currentDemo = checkDemoSession();
            setSession(currentDemo);
          }
          setLoading(false);
        })
        .catch(() => {
          if (!isMounted) return;
          const currentDemo = checkDemoSession();
          setSession(currentDemo);
          setLoading(false);
        });
    } catch {
      if (isMounted) {
        const currentDemo = checkDemoSession();
        setSession(currentDemo);
        setLoading(false);
      }
    }

    function handleCustomAuthChange() {
      if (!isMounted) return;
      const currentDemo = checkDemoSession();
      setSession(currentDemo);
      setLoading(false);
    }

    window.addEventListener("mediguide-auth-change", handleCustomAuthChange);

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
      window.removeEventListener("mediguide-auth-change", handleCustomAuthChange);
    };
  }, []);

  const user: User | null = session?.user ?? null;
  return { session, user, loading };
}

