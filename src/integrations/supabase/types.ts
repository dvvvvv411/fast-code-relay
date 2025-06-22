export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointment_recipients: {
        Row: {
          created_at: string
          email: string
          email_sent: boolean
          first_name: string
          id: string
          last_name: string
          phone_note: string | null
          unique_token: string
        }
        Insert: {
          created_at?: string
          email: string
          email_sent?: boolean
          first_name: string
          id?: string
          last_name: string
          phone_note?: string | null
          unique_token: string
        }
        Update: {
          created_at?: string
          email?: string
          email_sent?: boolean
          first_name?: string
          id?: string
          last_name?: string
          phone_note?: string | null
          unique_token?: string
        }
        Relationships: []
      }
      appointment_reminders: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          reminder_sent_at: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          reminder_sent_at?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          reminder_sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_status_history: {
        Row: {
          appointment_id: string
          changed_at: string
          created_at: string
          id: string
          new_status: string
          old_status: string | null
        }
        Insert: {
          appointment_id: string
          changed_at?: string
          created_at?: string
          id?: string
          new_status: string
          old_status?: string | null
        }
        Update: {
          appointment_id?: string
          changed_at?: string
          created_at?: string
          id?: string
          new_status?: string
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_status_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          confirmed_at: string | null
          created_at: string
          id: string
          recipient_id: string
          status: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          confirmed_at?: string | null
          created_at?: string
          id?: string
          recipient_id: string
          status?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          confirmed_at?: string | null
          created_at?: string
          id?: string
          recipient_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "appointment_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      auftraege: {
        Row: {
          anbieter: string
          anweisungen: Json
          app_store_link: string | null
          auftragsnummer: string
          created_at: string
          google_play_link: string | null
          id: string
          kontakt_email: string
          kontakt_name: string
          projektziel: string
          show_download_links: boolean
          title: string
          updated_at: string
        }
        Insert: {
          anbieter: string
          anweisungen?: Json
          app_store_link?: string | null
          auftragsnummer: string
          created_at?: string
          google_play_link?: string | null
          id?: string
          kontakt_email?: string
          kontakt_name?: string
          projektziel: string
          show_download_links?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          anbieter?: string
          anweisungen?: Json
          app_store_link?: string | null
          auftragsnummer?: string
          created_at?: string
          google_play_link?: string | null
          id?: string
          kontakt_email?: string
          kontakt_name?: string
          projektziel?: string
          show_download_links?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      auftrag_assignments: {
        Row: {
          access_email: string | null
          access_password: string | null
          access_phone: string | null
          assignment_url: string
          auftrag_id: string
          created_at: string
          id: string
          ident_code: string | null
          ident_link: string | null
          is_completed: boolean
          is_departed: boolean | null
          is_evaluated: boolean
          updated_at: string
          worker_first_name: string
          worker_last_name: string
        }
        Insert: {
          access_email?: string | null
          access_password?: string | null
          access_phone?: string | null
          assignment_url: string
          auftrag_id: string
          created_at?: string
          id?: string
          ident_code?: string | null
          ident_link?: string | null
          is_completed?: boolean
          is_departed?: boolean | null
          is_evaluated?: boolean
          updated_at?: string
          worker_first_name: string
          worker_last_name: string
        }
        Update: {
          access_email?: string | null
          access_password?: string | null
          access_phone?: string | null
          assignment_url?: string
          auftrag_id?: string
          created_at?: string
          id?: string
          ident_code?: string | null
          ident_link?: string | null
          is_completed?: boolean
          is_departed?: boolean | null
          is_evaluated?: boolean
          updated_at?: string
          worker_first_name?: string
          worker_last_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "auftrag_assignments_auftrag_id_fkey"
            columns: ["auftrag_id"]
            isOneToOne: false
            referencedRelation: "auftraege"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_times: {
        Row: {
          block_date: string
          block_time: string
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          block_date: string
          block_time: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          block_date?: string
          block_time?: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      contract_request_tokens: {
        Row: {
          appointment_id: string
          created_at: string
          email_sent: boolean
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          email_sent?: boolean
          expires_at?: string
          id?: string
          token: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          email_sent?: boolean
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_request_tokens_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_activity_logs: {
        Row: {
          activity_type: string
          assignment_id: string | null
          created_at: string
          details: Json | null
          employee_first_name: string
          employee_last_name: string
          evaluation_id: string | null
          id: string
        }
        Insert: {
          activity_type: string
          assignment_id?: string | null
          created_at?: string
          details?: Json | null
          employee_first_name: string
          employee_last_name: string
          evaluation_id?: string | null
          id?: string
        }
        Update: {
          activity_type?: string
          assignment_id?: string | null
          created_at?: string
          details?: Json | null
          employee_first_name?: string
          employee_last_name?: string
          evaluation_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_activity_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "auftrag_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_activity_logs_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_contracts: {
        Row: {
          appointment_id: string
          created_at: string
          email: string
          first_name: string
          health_insurance_name: string
          iban: string
          id: string
          id_card_back_url: string | null
          id_card_front_url: string | null
          last_name: string
          marital_status: string | null
          social_security_number: string
          start_date: string
          submitted_at: string
          tax_number: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          email: string
          first_name: string
          health_insurance_name: string
          iban: string
          id?: string
          id_card_back_url?: string | null
          id_card_front_url?: string | null
          last_name: string
          marital_status?: string | null
          social_security_number: string
          start_date: string
          submitted_at?: string
          tax_number: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          email?: string
          first_name?: string
          health_insurance_name?: string
          iban?: string
          id?: string
          id_card_back_url?: string | null
          id_card_front_url?: string | null
          last_name?: string
          marital_status?: string | null
          social_security_number?: string
          start_date?: string
          submitted_at?: string
          tax_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "employment_contracts_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_questions: {
        Row: {
          auftrag_id: string
          created_at: string
          id: string
          question_order: number
          question_text: string
        }
        Insert: {
          auftrag_id: string
          created_at?: string
          id?: string
          question_order?: number
          question_text: string
        }
        Update: {
          auftrag_id?: string
          created_at?: string
          id?: string
          question_order?: number
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_questions_auftrag_id_fkey"
            columns: ["auftrag_id"]
            isOneToOne: false
            referencedRelation: "auftraege"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          question_id: string
          star_rating: number
          text_feedback: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          question_id: string
          star_rating: number
          text_feedback?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          question_id?: string
          star_rating?: number
          text_feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "auftrag_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "evaluation_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_messages: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          message: string
          sender_name: string
          sender_type: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          message: string
          sender_name: string
          sender_type: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_name?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "live_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chats: {
        Row: {
          assignment_id: string | null
          closed_at: string | null
          created_at: string
          id: string
          session_id: string
          status: string
          unread_count: number
          worker_name: string
        }
        Insert: {
          assignment_id?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          session_id: string
          status?: string
          unread_count?: number
          worker_name: string
        }
        Update: {
          assignment_id?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          session_id?: string
          status?: string
          unread_count?: number
          worker_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_chats_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "auftrag_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_numbers: {
        Row: {
          access_code: string
          created_at: string
          id: string
          is_used: boolean
          phone: string
          source_domain: string | null
          source_url: string | null
          used_at: string | null
        }
        Insert: {
          access_code: string
          created_at?: string
          id?: string
          is_used?: boolean
          phone: string
          source_domain?: string | null
          source_url?: string | null
          used_at?: string | null
        }
        Update: {
          access_code?: string
          created_at?: string
          id?: string
          is_used?: boolean
          phone?: string
          source_domain?: string | null
          source_url?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      requests: {
        Row: {
          created_at: string
          id: string
          phone_number_id: string
          short_id: string | null
          sms_code: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone_number_id: string
          short_id?: string | null
          sms_code?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          phone_number_id?: string
          short_id?: string | null
          sms_code?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_phone_number_id_fkey"
            columns: ["phone_number_id"]
            isOneToOne: false
            referencedRelation: "phone_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          issue: string
          phone: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          issue: string
          phone: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          issue?: string
          phone?: string
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_assignment_url: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_short_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["user", "admin"],
    },
  },
} as const
