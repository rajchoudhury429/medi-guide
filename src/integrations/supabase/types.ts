export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          doctor_id: string | null
          doctor_name: string
          id: string
          reason: string | null
          specialty: string | null
          status: string
          user_id: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          doctor_id?: string | null
          doctor_name: string
          id?: string
          reason?: string | null
          specialty?: string | null
          status?: string
          user_id: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          doctor_id?: string | null
          doctor_name?: string
          id?: string
          reason?: string | null
          specialty?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          clinic_address: string | null
          clinic_name: string | null
          consultation_fee: number | null
          experience_years: number
          id: string
          name: string
          phone: string | null
          qualification: string | null
          rating: number
          specialty: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          consultation_fee?: number | null
          experience_years?: number
          id?: string
          name: string
          phone?: string | null
          qualification?: string | null
          rating?: number
          specialty: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          consultation_fee?: number | null
          experience_years?: number
          id?: string
          name?: string
          phone?: string | null
          qualification?: string | null
          rating?: number
          specialty?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          relationship: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          relationship?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          relationship?: string | null
          user_id?: string
        }
        Relationships: []
      }
      facilities: {
        Row: {
          address: string | null
          city: string | null
          closes_at: string | null
          id: string
          kind: string
          latitude: number
          longitude: number
          name: string
          open_24h: boolean
          opens_at: string | null
          phone: string | null
          rating: number
        }
        Insert: {
          address?: string | null
          city?: string | null
          closes_at?: string | null
          id?: string
          kind?: string
          latitude: number
          longitude: number
          name: string
          open_24h?: boolean
          opens_at?: string | null
          phone?: string | null
          rating?: number
        }
        Update: {
          address?: string | null
          city?: string | null
          closes_at?: string | null
          id?: string
          kind?: string
          latitude?: number
          longitude?: number
          name?: string
          open_24h?: boolean
          opens_at?: string | null
          phone?: string | null
          rating?: number
        }
        Relationships: []
      }
      health_records: {
        Row: {
          created_at: string
          file_name: string | null
          file_path: string | null
          id: string
          notes: string | null
          record_date: string | null
          record_type: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          record_date?: string | null
          record_type?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          record_date?: string | null
          record_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      medicine_reminders: {
        Row: {
          active: boolean
          created_at: string
          dosage: string | null
          end_date: string | null
          id: string
          medicine_name: string
          notes: string | null
          start_date: string
          times: string[]
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          id?: string
          medicine_name: string
          notes?: string | null
          start_date?: string
          times?: string[]
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          id?: string
          medicine_name?: string
          notes?: string | null
          start_date?: string
          times?: string[]
          user_id?: string
        }
        Relationships: []
      }
      medicines: {
        Row: {
          age_restrictions: string | null
          category: string | null
          dosage_guidance: string | null
          generic_name: string | null
          id: string
          interactions: string | null
          name: string
          pregnancy_warning: string | null
          prescription_required: boolean
          side_effects: string | null
          uses: string
          warnings: string | null
        }
        Insert: {
          age_restrictions?: string | null
          category?: string | null
          dosage_guidance?: string | null
          generic_name?: string | null
          id?: string
          interactions?: string | null
          name: string
          pregnancy_warning?: string | null
          prescription_required?: boolean
          side_effects?: string | null
          uses: string
          warnings?: string | null
        }
        Update: {
          age_restrictions?: string | null
          category?: string | null
          dosage_guidance?: string | null
          generic_name?: string | null
          id?: string
          interactions?: string | null
          name?: string
          pregnancy_warning?: string | null
          prescription_required?: boolean
          side_effects?: string | null
          uses?: string
          warnings?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          allergies: string | null
          blood_group: string | null
          chronic_conditions: string | null
          created_at: string
          full_name: string | null
          height_cm: number | null
          id: string
          language: string
          notifications_enabled: boolean
          phone: string | null
          share_location: boolean
          theme: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          allergies?: string | null
          blood_group?: string | null
          chronic_conditions?: string | null
          created_at?: string
          full_name?: string | null
          height_cm?: number | null
          id: string
          language?: string
          notifications_enabled?: boolean
          phone?: string | null
          share_location?: boolean
          theme?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          allergies?: string | null
          blood_group?: string | null
          chronic_conditions?: string | null
          created_at?: string
          full_name?: string | null
          height_cm?: number | null
          id?: string
          language?: string
          notifications_enabled?: boolean
          phone?: string | null
          share_location?: boolean
          theme?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      reminder_logs: {
        Row: {
          id: string
          reminder_id: string
          scheduled_time: string
          status: string
          taken_at: string
          user_id: string
        }
        Insert: {
          id?: string
          reminder_id: string
          scheduled_time: string
          status?: string
          taken_at?: string
          user_id: string
        }
        Update: {
          id?: string
          reminder_id?: string
          scheduled_time?: string
          status?: string
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "medicine_reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      symptom_checks: {
        Row: {
          created_at: string
          id: string
          summary: string | null
          symptoms: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          summary?: string | null
          symptoms: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          summary?: string | null
          symptoms?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
