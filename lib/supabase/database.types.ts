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
      action_logs: {
        Row: {
          action_id: string
          created_at: string | null
          id: string
          log_date: string
          user_id: string
        }
        Insert: {
          action_id: string
          created_at?: string | null
          id: string
          log_date: string
          user_id: string
        }
        Update: {
          action_id?: string
          created_at?: string | null
          id?: string
          log_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_logs_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_logs_action_user_id_fkey"
            columns: ["action_id", "user_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      actions: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          kind: string
          position: number
          sub_goal_id: string
          title: string
          user_id: string
          weekly_target: number | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id: string
          kind: string
          position: number
          sub_goal_id: string
          title: string
          user_id: string
          weekly_target?: number | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          kind?: string
          position?: number
          sub_goal_id?: string
          title?: string
          user_id?: string
          weekly_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "actions_sub_goal_id_fkey"
            columns: ["sub_goal_id"]
            isOneToOne: false
            referencedRelation: "sub_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_sub_goal_user_id_fkey"
            columns: ["sub_goal_id", "user_id"]
            isOneToOne: false
            referencedRelation: "sub_goals"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      charts: {
        Row: {
          archived_at: string | null
          id: string
          started_at: string | null
          status: string
          target_date: string | null
          title: string
          user_id: string
          why: string | null
        }
        Insert: {
          archived_at?: string | null
          id: string
          started_at?: string | null
          status?: string
          target_date?: string | null
          title: string
          user_id: string
          why?: string | null
        }
        Update: {
          archived_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          target_date?: string | null
          title?: string
          user_id?: string
          why?: string | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          body: string
          created_at: string | null
          entry_date: string
          id: string
          mood: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string | null
          entry_date: string
          id: string
          mood?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          entry_date?: string
          id?: string
          mood?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          day_start_hour: number
          display_name: string | null
          id: string
          timezone: string
        }
        Insert: {
          created_at?: string | null
          day_start_hour?: number
          display_name?: string | null
          id: string
          timezone?: string
        }
        Update: {
          created_at?: string | null
          day_start_hour?: number
          display_name?: string | null
          id?: string
          timezone?: string
        }
        Relationships: []
      }
      sub_goals: {
        Row: {
          archived_at: string | null
          chart_id: string
          id: string
          position: number
          title: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          chart_id: string
          id: string
          position: number
          title: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          chart_id?: string
          id?: string
          position?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_goals_chart_id_fkey"
            columns: ["chart_id"]
            isOneToOne: false
            referencedRelation: "charts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_goals_chart_user_id_fkey"
            columns: ["chart_id", "user_id"]
            isOneToOne: false
            referencedRelation: "charts"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_sub_goal: {
        Args: { p_chart_id: string; p_sub_goal_id: string }
        Returns: undefined
      }
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
    Enums: {},
  },
} as const
