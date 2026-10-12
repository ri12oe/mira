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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      backups: {
        Row: {
          alert_after_minutes: number
          created_at: string
          id: string
          name: string
          phone: string
          position: number
          relationship: string | null
          taker_id: string
          updated_at: string
        }
        Insert: {
          alert_after_minutes?: number
          created_at?: string
          id?: string
          name: string
          phone: string
          position: number
          relationship?: string | null
          taker_id: string
          updated_at?: string
        }
        Update: {
          alert_after_minutes?: number
          created_at?: string
          id?: string
          name?: string
          phone?: string
          position?: number
          relationship?: string | null
          taker_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backups_taker_id_fkey"
            columns: ["taker_id"]
            isOneToOne: false
            referencedRelation: "takers"
            referencedColumns: ["id"]
          },
        ]
      }
      caregivers: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          phone: string | null
          photo_path: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string
          id: string
          phone?: string | null
          photo_path?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          phone?: string | null
          photo_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          alert_at: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["check_in_kind"]
          local_date: string
          responded_at: string | null
          responded_via: Database["public"]["Enums"]["check_in_method"] | null
          status: Database["public"]["Enums"]["check_in_status"]
          taker_id: string
          window_ends_at: string
          window_starts_at: string
        }
        Insert: {
          alert_at: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["check_in_kind"]
          local_date: string
          responded_at?: string | null
          responded_via?: Database["public"]["Enums"]["check_in_method"] | null
          status?: Database["public"]["Enums"]["check_in_status"]
          taker_id: string
          window_ends_at: string
          window_starts_at: string
        }
        Update: {
          alert_at?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["check_in_kind"]
          local_date?: string
          responded_at?: string | null
          responded_via?: Database["public"]["Enums"]["check_in_method"] | null
          status?: Database["public"]["Enums"]["check_in_status"]
          taker_id?: string
          window_ends_at?: string
          window_starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_taker_id_fkey"
            columns: ["taker_id"]
            isOneToOne: false
            referencedRelation: "takers"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          message: string
          status: Database["public"]["Enums"]["invite_status"]
          taker_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          message: string
          status?: Database["public"]["Enums"]["invite_status"]
          taker_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          message?: string
          status?: Database["public"]["Enums"]["invite_status"]
          taker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_taker_id_fkey"
            columns: ["taker_id"]
            isOneToOne: false
            referencedRelation: "takers"
            referencedColumns: ["id"]
          },
        ]
      }
      sends: {
        Row: {
          attempts: number
          backup_id: string | null
          caregiver_id: string
          channel: Database["public"]["Enums"]["send_channel"]
          check_in_id: string | null
          created_at: string
          dedupe_key: string
          error: string | null
          id: string
          invite_id: string | null
          provider_id: string | null
          purpose: Database["public"]["Enums"]["send_purpose"]
          status: Database["public"]["Enums"]["send_status"]
          taker_id: string | null
          to_phone: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          backup_id?: string | null
          caregiver_id: string
          channel: Database["public"]["Enums"]["send_channel"]
          check_in_id?: string | null
          created_at?: string
          dedupe_key: string
          error?: string | null
          id?: string
          invite_id?: string | null
          provider_id?: string | null
          purpose: Database["public"]["Enums"]["send_purpose"]
          status?: Database["public"]["Enums"]["send_status"]
          taker_id?: string | null
          to_phone?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          backup_id?: string | null
          caregiver_id?: string
          channel?: Database["public"]["Enums"]["send_channel"]
          check_in_id?: string | null
          created_at?: string
          dedupe_key?: string
          error?: string | null
          id?: string
          invite_id?: string | null
          provider_id?: string | null
          purpose?: Database["public"]["Enums"]["send_purpose"]
          status?: Database["public"]["Enums"]["send_status"]
          taker_id?: string | null
          to_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sends_backup_id_fkey"
            columns: ["backup_id"]
            isOneToOne: false
            referencedRelation: "backups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sends_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "caregivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sends_check_in_id_fkey"
            columns: ["check_in_id"]
            isOneToOne: false
            referencedRelation: "check_ins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sends_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sends_taker_id_fkey"
            columns: ["taker_id"]
            isOneToOne: false
            referencedRelation: "takers"
            referencedColumns: ["id"]
          },
        ]
      }
      takers: {
        Row: {
          caregiver_id: string
          caregiver_relationship: string | null
          created_at: string
          days: number[]
          extra_minutes: number
          first_name: string
          id: string
          joined_at: string | null
          method: Database["public"]["Enums"]["check_in_method"]
          paused: boolean
          phone: string
          status: Database["public"]["Enums"]["taker_status"]
          time_zone: string
          updated_at: string
          window_end: number
          window_start: number
        }
        Insert: {
          caregiver_id?: string
          caregiver_relationship?: string | null
          created_at?: string
          days?: number[]
          extra_minutes?: number
          first_name: string
          id?: string
          joined_at?: string | null
          method?: Database["public"]["Enums"]["check_in_method"]
          paused?: boolean
          phone: string
          status?: Database["public"]["Enums"]["taker_status"]
          time_zone: string
          updated_at?: string
          window_end?: number
          window_start?: number
        }
        Update: {
          caregiver_id?: string
          caregiver_relationship?: string | null
          created_at?: string
          days?: number[]
          extra_minutes?: number
          first_name?: string
          id?: string
          joined_at?: string | null
          method?: Database["public"]["Enums"]["check_in_method"]
          paused?: boolean
          phone?: string
          status?: Database["public"]["Enums"]["taker_status"]
          time_zone?: string
          updated_at?: string
          window_end?: number
          window_start?: number
        }
        Relationships: [
          {
            foreignKeyName: "takers_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "caregivers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_valid_time_zone: { Args: { tz: string }; Returns: boolean }
    }
    Enums: {
      check_in_kind: "scheduled" | "on_demand"
      check_in_method: "text" | "call" | "app"
      check_in_status: "pending" | "on_time" | "late" | "missed"
      invite_status: "pending" | "accepted" | "cancelled"
      send_channel: "sms" | "call" | "push"
      send_purpose:
        | "invite"
        | "check_in_prompt"
        | "reminder"
        | "caregiver_alert"
        | "backup_alert"
      send_status: "queued" | "sent" | "delivered" | "failed"
      taker_status: "draft" | "invited" | "active"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      check_in_kind: ["scheduled", "on_demand"],
      check_in_method: ["text", "call", "app"],
      check_in_status: ["pending", "on_time", "late", "missed"],
      invite_status: ["pending", "accepted", "cancelled"],
      send_channel: ["sms", "call", "push"],
      send_purpose: [
        "invite",
        "check_in_prompt",
        "reminder",
        "caregiver_alert",
        "backup_alert",
      ],
      send_status: ["queued", "sent", "delivered", "failed"],
      taker_status: ["draft", "invited", "active"],
    },
  },
} as const
