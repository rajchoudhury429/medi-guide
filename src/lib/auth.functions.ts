import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequest } from "@tanstack/react-start/server";
import { ensureLocalDb, saveLocalDb, type LocalUser, type LocalLoginLog, type LocalSession } from "./local-db.server";

const SignUpInput = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  fullName: z.string().trim().min(2),
});

const SignInInput = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return `hash_${Math.abs(hash)}_${password.length}`;
}

export const localSignUpFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SignUpInput.parse(input))
  .handler(async ({ data }) => {
    const db = ensureLocalDb();
    const existing = db.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newUser: LocalUser = {
      id: userId,
      email: data.email.toLowerCase(),
      password_hash: simpleHash(data.password),
      full_name: data.fullName,
      created_at: new Date().toISOString(),
    };

    db.users.push(newUser);

    const req = getRequest();
    const userAgent = req?.headers.get("user-agent") ?? "Unknown";

    const logEntry: LocalLoginLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      email: newUser.email,
      login_timestamp: new Date().toISOString(),
      status: "SUCCESS",
      user_agent: userAgent,
    };
    db.login_logs.push(logEntry);

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const session: LocalSession = {
      id: sessionId,
      user_id: userId,
      user: {
        id: userId,
        email: newUser.email,
        user_metadata: { full_name: newUser.full_name },
      },
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    db.sessions.push(session);
    saveLocalDb(db);

    return { session, user: session.user };
  });

export const localSignInFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SignInInput.parse(input))
  .handler(async ({ data }) => {
    const db = ensureLocalDb();
    const user = db.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    const req = getRequest();
    const userAgent = req?.headers.get("user-agent") ?? "Unknown";

    if (!user || user.password_hash !== simpleHash(data.password)) {
      const failedLog: LocalLoginLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        user_id: user?.id ?? "unknown",
        email: data.email,
        login_timestamp: new Date().toISOString(),
        status: "FAILED",
        user_agent: userAgent,
      };
      db.login_logs.push(failedLog);
      saveLocalDb(db);
      throw new Error("Invalid email or password.");
    }

    const logEntry: LocalLoginLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: user.id,
      email: user.email,
      login_timestamp: new Date().toISOString(),
      status: "SUCCESS",
      user_agent: userAgent,
    };
    db.login_logs.push(logEntry);

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const session: LocalSession = {
      id: sessionId,
      user_id: user.id,
      user: {
        id: user.id,
        email: user.email,
        user_metadata: { full_name: user.full_name },
      },
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    db.sessions.push(session);
    saveLocalDb(db);

    return { session, user: session.user };
  });

export const getLoginLogsFn = createServerFn({ method: "GET" }).handler(async () => {
  const db = ensureLocalDb();
  return db.login_logs.slice(-50).reverse();
});

const ResetInput = z.object({
  email: z.string().trim().email(),
  newPassword: z.string().min(6).optional(),
});

export const localResetPasswordFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ResetInput.parse(input))
  .handler(async ({ data }) => {
    const db = ensureLocalDb();
    const userIndex = db.users.findIndex((u) => u.email.toLowerCase() === data.email.toLowerCase());

    if (userIndex === -1) {
      throw new Error("No account found with this email address.");
    }

    if (data.newPassword) {
      db.users[userIndex].password_hash = simpleHash(data.newPassword);
      saveLocalDb(db);
      return { success: true, message: "Password updated successfully." };
    }

    return { success: true, userEmail: db.users[userIndex].email };
  });

