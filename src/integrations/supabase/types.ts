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
  public: {
    Tables: {
      athletes: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      match_points: {
        Row: {
          athlete_id: string
          match_id: string
          points: number
          season: string
          won: boolean
        }
        Insert: {
          athlete_id: string
          match_id: string
          points: number
          season: string
          won: boolean
        }
        Update: {
          athlete_id?: string
          match_id?: string
          points?: number
          season?: string
          won?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "match_points_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_points_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "season_ranking"
            referencedColumns: ["athlete_id"]
          },
          {
            foreignKeyName: "match_points_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          a1: string
          a2: string
          b1: string
          b2: string
          created_at: string
          created_by: string | null
          doubled: boolean
          id: string
          played_on: string
          request_id: string
          score_a: number
          score_b: number
          season: string
        }
        Insert: {
          a1: string
          a2: string
          b1: string
          b2: string
          created_at?: string
          created_by?: string | null
          doubled?: boolean
          id?: string
          played_on: string
          request_id: string
          score_a: number
          score_b: number
          season: string
        }
        Update: {
          a1?: string
          a2?: string
          b1?: string
          b2?: string
          created_at?: string
          created_by?: string | null
          doubled?: boolean
          id?: string
          played_on?: string
          request_id?: string
          score_a?: number
          score_b?: number
          season?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_a1_fkey"
            columns: ["a1"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_a1_fkey"
            columns: ["a1"]
            isOneToOne: false
            referencedRelation: "season_ranking"
            referencedColumns: ["athlete_id"]
          },
          {
            foreignKeyName: "matches_a2_fkey"
            columns: ["a2"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_a2_fkey"
            columns: ["a2"]
            isOneToOne: false
            referencedRelation: "season_ranking"
            referencedColumns: ["athlete_id"]
          },
          {
            foreignKeyName: "matches_b1_fkey"
            columns: ["b1"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_b1_fkey"
            columns: ["b1"]
            isOneToOne: false
            referencedRelation: "season_ranking"
            referencedColumns: ["athlete_id"]
          },
          {
            foreignKeyName: "matches_b2_fkey"
            columns: ["b2"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_b2_fkey"
            columns: ["b2"]
            isOneToOne: false
            referencedRelation: "season_ranking"
            referencedColumns: ["athlete_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      season_ranking: {
        Row: {
          active: boolean | null
          athlete_id: string | null
          games: number | null
          name: string | null
          points: number | null
          season: string | null
          wins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_match: {
        Args: {
          _a1: string
          _a2: string
          _b1: string
          _b2: string
          _doubled: boolean
          _played_on: string
          _request_id: string
          _score_a: number
          _score_b: number
        }
        Returns: string
      }
      grant_admin: { Args: { _email: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      list_admins: {
        Args: never
        Returns: {
          email: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      match_points_for: {
        Args: { _doubled: boolean; _loser_score: number; _winner_score: number }
        Returns: {
          lose_pts: number
          win_pts: number
        }[]
      }
      revoke_admin: { Args: { _user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "owner" | "admin"
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
  public: {
    Enums: {
      app_role: ["owner", "admin"],
    },
  },
} as const
