import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ensureLocalDb, saveLocalDb } from "./local-db.server";

const ProfileSaveInput = z.object({
  userId: z.string().min(1),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  age: z.string().optional(),
  bloodType: z.string().optional(),
  emergencyContact: z.string().optional(),
  medicalHistory: z.string().optional(),
  language: z.string().optional(),
});

const ProfileGetInput = z.object({
  userId: z.string().min(1),
});

const SymptomSaveInput = z.object({
  userId: z.string().min(1),
  symptoms: z.string().min(1),
  summary: z.string().min(1),
  messages: z.array(z.any()).optional(),
});

const SymptomGetInput = z.object({
  userId: z.string().min(1),
});

export const saveUserProfileFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ProfileSaveInput.parse(input))
  .handler(async ({ data }) => {
    const db = ensureLocalDb();
    
    // Find or create profile
    let profile = db.profiles.find((p) => p.id === data.userId || p.user_id === data.userId);
    
    if (!profile) {
      profile = {
        id: data.userId,
        user_id: data.userId,
        created_at: new Date().toISOString(),
      };
      db.profiles.push(profile);
    }

    if (data.fullName !== undefined) profile.full_name = data.fullName;
    if (data.phone !== undefined) profile.phone = data.phone;
    if (data.age !== undefined) profile.age = data.age;
    if (data.bloodType !== undefined) profile.blood_type = data.bloodType;
    if (data.emergencyContact !== undefined) profile.emergency_contact = data.emergencyContact;
    if (data.medicalHistory !== undefined) profile.medical_history = data.medicalHistory;
    if (data.language !== undefined) profile.preferred_language = data.language;
    profile.updated_at = new Date().toISOString();

    // Also sync full_name in users list
    const user = db.users.find((u) => u.id === data.userId);
    if (user && data.fullName) {
      user.full_name = data.fullName;
    }

    saveLocalDb(db);
    return { success: true, profile };
  });

export const getUserProfileFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ProfileGetInput.parse(input))
  .handler(async ({ data }) => {
    const db = ensureLocalDb();
    const user = db.users.find((u) => u.id === data.userId);
    const profile = db.profiles.find((p) => p.id === data.userId || p.user_id === data.userId);

    return {
      full_name: profile?.full_name ?? user?.full_name ?? "",
      email: user?.email ?? "",
      phone: profile?.phone ?? "",
      age: profile?.age ?? "",
      blood_type: profile?.blood_type ?? "",
      emergency_contact: profile?.emergency_contact ?? "",
      medical_history: profile?.medical_history ?? "",
      preferred_language: profile?.preferred_language ?? "en",
    };
  });

export const saveSymptomCheckFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SymptomSaveInput.parse(input))
  .handler(async ({ data }) => {
    const db = ensureLocalDb();
    const entry = {
      id: `sym_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: data.userId,
      symptoms: data.symptoms,
      summary: data.summary,
      messages: data.messages ?? [],
      created_at: new Date().toISOString(),
    };

    db.symptom_checks.push(entry);
    saveLocalDb(db);
    return { success: true, entry };
  });

export const getSymptomChecksFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SymptomGetInput.parse(input))
  .handler(async ({ data }) => {
    const db = ensureLocalDb();
    const userChecks = db.symptom_checks.filter((s) => s.user_id === data.userId);
    userChecks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return userChecks;
  });

const AppointmentBookInput = z.object({
  userId: z.string().min(1),
  doctorId: z.string().min(1),
  doctorName: z.string().min(1),
  specialty: z.string().min(1),
  appointmentDate: z.string().min(1),
  appointmentTime: z.string().min(1),
  reason: z.string().optional(),
});

const AppointmentCancelInput = z.object({
  userId: z.string().min(1),
  appointmentId: z.string().min(1),
});

export const bookAppointmentFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AppointmentBookInput.parse(input))
  .handler(async ({ data }) => {
    const db = ensureLocalDb();
    const newAppointment = {
      id: `apt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: data.userId,
      doctor_id: data.doctorId,
      doctor_name: data.doctorName,
      specialty: data.specialty,
      appointment_date: data.appointmentDate,
      appointment_time: data.appointmentTime,
      reason: data.reason || null,
      status: "scheduled",
      created_at: new Date().toISOString(),
    };

    db.appointments.push(newAppointment);
    saveLocalDb(db);
    return { success: true, appointment: newAppointment };
  });

export const getAppointmentsFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SymptomGetInput.parse(input))
  .handler(async ({ data }) => {
    const db = ensureLocalDb();
    const userAppointments = db.appointments.filter((a) => a.user_id === data.userId);
    userAppointments.sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
    return userAppointments;
  });

export const cancelAppointmentFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AppointmentCancelInput.parse(input))
  .handler(async ({ data }) => {
    const db = ensureLocalDb();
    const apt = db.appointments.find((a) => a.id === data.appointmentId && a.user_id === data.userId);
    if (apt) {
      apt.status = "cancelled";
      saveLocalDb(db);
    }
    return { success: true };
  });

