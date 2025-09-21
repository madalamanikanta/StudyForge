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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      imports: {
        Row: {
          created_at: string
          id: string
          import_data: Json
          last_synced: string
          platform: string
          problems_count: number
          status: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          import_data?: Json
          last_synced?: string
          platform: string
          problems_count?: number
          status?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          import_data?: Json
          last_synced?: string
          platform?: string
          problems_count?: number
          status?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      plan_items: {
        Row: {
          completed_at: string | null
          confidence_level: number | null
          created_at: string
          description: string | null
          difficulty_level: string
          estimated_duration_minutes: number
          id: string
          order_index: number
          prerequisites: string[] | null
          status: string
          study_plan_id: string
          title: string
          topic: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          confidence_level?: number | null
          created_at?: string
          description?: string | null
          difficulty_level?: string
          estimated_duration_minutes?: number
          id?: string
          order_index?: number
          prerequisites?: string[] | null
          status?: string
          study_plan_id: string
          title: string
          topic: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          confidence_level?: number | null
          created_at?: string
          description?: string | null
          difficulty_level?: string
          estimated_duration_minutes?: number
          id?: string
          order_index?: number
          prerequisites?: string[] | null
          status?: string
          study_plan_id?: string
          title?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_items_study_plan_id_fkey"
            columns: ["study_plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          study_preferences: Json | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          study_preferences?: Json | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          study_preferences?: Json | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_logs: {
        Row: {
          activity_type: string
          concept_id: string | null
          confidence_after: number | null
          confidence_before: number | null
          correctness: number | null
          created_at: string
          id: string
          item_id: string | null
          metadata: Json | null
          notes: string | null
          time_taken_minutes: number | null
          user_id: string
        }
        Insert: {
          activity_type: string
          concept_id?: string | null
          confidence_after?: number | null
          confidence_before?: number | null
          correctness?: number | null
          created_at?: string
          id?: string
          item_id?: string | null
          metadata?: Json | null
          notes?: string | null
          time_taken_minutes?: number | null
          user_id: string
        }
        Update: {
          activity_type?: string
          concept_id?: string | null
          confidence_after?: number | null
          confidence_before?: number | null
          correctness?: number | null
          created_at?: string
          id?: string
          item_id?: string | null
          metadata?: Json | null
          notes?: string | null
          time_taken_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "plan_items"
            referencedColumns: ["id"]
          },
        ]
      }
      snapshots: {
        Row: {
          generated_at: string
          id: string
          is_exported: boolean
          pdf_url: string | null
          snapshot_data: Json
          title: string
          user_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          is_exported?: boolean
          pdf_url?: string | null
          snapshot_data?: Json
          title: string
          user_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          is_exported?: boolean
          pdf_url?: string | null
          snapshot_data?: Json
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      spaced_items: {
        Row: {
          concept_id: string
          concept_title: string
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          last_reviewed: string | null
          next_review: string
          repetitions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          concept_id: string
          concept_title: string
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed?: string | null
          next_review?: string
          repetitions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          concept_id?: string
          concept_title?: string
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed?: string | null
          next_review?: string
          repetitions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          ai_generated: boolean | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          goal: string | null
          hours_per_week: number | null
          id: string
          status: string | null
          timeline_days: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_generated?: boolean | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          goal?: string | null
          hours_per_week?: number | null
          id?: string
          status?: string | null
          timeline_days?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_generated?: boolean | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          goal?: string | null
          hours_per_week?: number | null
          id?: string
          status?: string | null
          timeline_days?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          difficulty_rating: number | null
          duration_minutes: number | null
          id: string
          notes: string | null
          study_plan_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          difficulty_rating?: number | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          study_plan_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          difficulty_rating?: number | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          study_plan_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_study_plan_id_fkey"
            columns: ["study_plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_audit: {
        Row: {
          data_checksum: string | null
          error_message: string | null
          id: string
          sync_status: string
          sync_type: string
          synced_at: string
          user_id: string
        }
        Insert: {
          data_checksum?: string | null
          error_message?: string | null
          id?: string
          sync_status?: string
          sync_type: string
          synced_at?: string
          user_id: string
        }
        Update: {
          data_checksum?: string | null
          error_message?: string | null
          id?: string
          sync_status?: string
          sync_type?: string
          synced_at?: string
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
