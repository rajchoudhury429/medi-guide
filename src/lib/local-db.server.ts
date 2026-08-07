import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.resolve(DATA_DIR, "db.json");

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
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), "utf-8");
      return INITIAL_DB;
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content) as DatabaseSchema;
  } catch (err) {
    console.error("Local DB read error:", err);
    return INITIAL_DB;
  }
}

export function saveLocalDb(db: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Local DB save error:", err);
  }
}
