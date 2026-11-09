import fs from "node:fs";
import path from "node:path";

function getDbPath(): string {
  try {
    const dir = path.resolve(process.cwd(), "data");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const testFile = path.resolve(dir, ".perm-test");
    fs.writeFileSync(testFile, "ok");
    fs.unlinkSync(testFile);
    return path.resolve(dir, "db.json");
  } catch {
    // In serverless environments (Netlify functions, AWS Lambda), process.cwd() is read-only
    const tmpBase = process.env.TEMP || process.env.TMP || "/tmp";
    const tmpDir = path.resolve(tmpBase, "mediguide-data");
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch {}
    }
    return path.resolve(tmpDir, "db.json");
  }
}

export interface LocalUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  created_at: string;
}

export interface LocalLoginLog {
  id: string;
  user_id: string;
  email: string;
  login_timestamp: string;
  status: "SUCCESS" | "FAILED";
  user_agent?: string;
  ip?: string;
}

export interface LocalSession {
  id: string;
  user_id: string;
  user: {
    id: string;
    email: string;
    user_metadata: { full_name: string };
  };
  created_at: string;
  expires_at: string;
}

export interface DatabaseSchema {
  users: LocalUser[];
  sessions: LocalSession[];
  login_logs: LocalLoginLog[];
  profiles: Record<string, any>[];
  symptom_checks: Record<string, any>[];
  appointments: Record<string, any>[];
  reminders: Record<string, any>[];
  records: Record<string, any>[];
  emergency_contacts: Record<string, any>[];
}

const INITIAL_DB: DatabaseSchema = {
  users: [],
  sessions: [],
  login_logs: [],
  profiles: [],
  symptom_checks: [],
  appointments: [],
  reminders: [],
  records: [],
  emergency_contacts: [],
};

export function ensureLocalDb(): DatabaseSchema {
  try {
    const dbFile = getDbPath();
    const dataDir = path.dirname(dbFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(dbFile)) {
      fs.writeFileSync(dbFile, JSON.stringify(INITIAL_DB, null, 2), "utf-8");
      return { ...INITIAL_DB };
    }

    const content = fs.readFileSync(dbFile, "utf-8").trim();
    if (!content) {
      return { ...INITIAL_DB };
    }

    const parsed = JSON.parse(content) as Partial<DatabaseSchema>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      login_logs: Array.isArray(parsed.login_logs) ? parsed.login_logs : [],
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
      symptom_checks: Array.isArray(parsed.symptom_checks) ? parsed.symptom_checks : [],
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments : [],
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
      records: Array.isArray(parsed.records) ? parsed.records : [],
      emergency_contacts: Array.isArray(parsed.emergency_contacts) ? parsed.emergency_contacts : [],
    };
  } catch (err) {
    console.error("Local DB read error:", err);
    return { ...INITIAL_DB };
  }
}

export function saveLocalDb(db: DatabaseSchema): void {
  try {
    const dbFile = getDbPath();
    const dataDir = path.dirname(dbFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write atomically via temporary file to prevent partial write corruption
    const tempFile = `${dbFile}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), "utf-8");
    fs.renameSync(tempFile, dbFile);
  } catch (err) {
    console.error("Local DB save error:", err);
  }
}
