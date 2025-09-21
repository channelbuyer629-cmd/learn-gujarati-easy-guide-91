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
      achievement_progress: {
        Row: {
          achievement_type: string
          bonus_claimed: boolean
          created_at: string
          current_count: number
          id: string
          last_updated: string
          user_id: string
        }
        Insert: {
          achievement_type: string
          bonus_claimed?: boolean
          created_at?: string
          current_count?: number
          id?: string
          last_updated?: string
          user_id: string
        }
        Update: {
          achievement_type?: string
          bonus_claimed?: boolean
          created_at?: string
          current_count?: number
          id?: string
          last_updated?: string
          user_id?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          badge_type: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          points_required: number | null
        }
        Insert: {
          badge_type?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          points_required?: number | null
        }
        Update: {
          badge_type?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          points_required?: number | null
        }
        Relationships: []
      }
      antonyms: {
        Row: {
          created_at: string
          created_by: string | null
          difficulty_level: number | null
          english_meaning: string
          gujarati_antonyms: string
          gujarati_word: string
          id: string
          updated_at: string
          usage_example_english: string
          usage_example_gujarati: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          difficulty_level?: number | null
          english_meaning: string
          gujarati_antonyms: string
          gujarati_word: string
          id?: string
          updated_at?: string
          usage_example_english: string
          usage_example_gujarati: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          difficulty_level?: number | null
          english_meaning?: string
          gujarati_antonyms?: string
          gujarati_word?: string
          id?: string
          updated_at?: string
          usage_example_english?: string
          usage_example_gujarati?: string
        }
        Relationships: []
      }
      app_usage_sessions: {
        Row: {
          activities_completed: number | null
          created_at: string
          id: string
          page_visits: Json | null
          session_end: string | null
          session_start: string
          total_time_minutes: number | null
          user_id: string
        }
        Insert: {
          activities_completed?: number | null
          created_at?: string
          id?: string
          page_visits?: Json | null
          session_end?: string | null
          session_start?: string
          total_time_minutes?: number | null
          user_id: string
        }
        Update: {
          activities_completed?: number | null
          created_at?: string
          id?: string
          page_visits?: Json | null
          session_end?: string | null
          session_start?: string
          total_time_minutes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      basic_learning: {
        Row: {
          audio_url: string | null
          content_type: string
          created_at: string | null
          created_by: string | null
          difficulty_level: number | null
          english_content: string
          gujarati_content: string
          id: string
          image_url: string | null
          order_sequence: number | null
          transliteration: string | null
          updated_at: string | null
        }
        Insert: {
          audio_url?: string | null
          content_type: string
          created_at?: string | null
          created_by?: string | null
          difficulty_level?: number | null
          english_content: string
          gujarati_content: string
          id?: string
          image_url?: string | null
          order_sequence?: number | null
          transliteration?: string | null
          updated_at?: string | null
        }
        Update: {
          audio_url?: string | null
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          difficulty_level?: number | null
          english_content?: string
          gujarati_content?: string
          id?: string
          image_url?: string | null
          order_sequence?: number | null
          transliteration?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      culture_content: {
        Row: {
          content: string
          content_type: string
          created_at: string
          created_by: string | null
          english_translation: string | null
          gujarati_text: string | null
          id: string
          image_url: string | null
          title: string
        }
        Insert: {
          content: string
          content_type: string
          created_at?: string
          created_by?: string | null
          english_translation?: string | null
          gujarati_text?: string | null
          id?: string
          image_url?: string | null
          title: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string
          created_by?: string | null
          english_translation?: string | null
          gujarati_text?: string | null
          id?: string
          image_url?: string | null
          title?: string
        }
        Relationships: []
      }
      daily_logins: {
        Row: {
          created_at: string
          id: string
          login_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          login_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          login_date?: string
          user_id?: string
        }
        Relationships: []
      }
      dialogues: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          dialogue_data: Json
          difficulty_level: number | null
          id: string
          scenario: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          dialogue_data: Json
          difficulty_level?: number | null
          id?: string
          scenario: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          dialogue_data?: Json
          difficulty_level?: number | null
          id?: string
          scenario?: string
          title?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          created_at: string
          id: string
          is_learned: boolean | null
          last_reviewed: string | null
          times_reviewed: number | null
          user_id: string
          vocabulary_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_learned?: boolean | null
          last_reviewed?: string | null
          times_reviewed?: number | null
          user_id: string
          vocabulary_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_learned?: boolean | null
          last_reviewed?: string | null
          times_reviewed?: number | null
          user_id?: string
          vocabulary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_vocabulary_id_fkey"
            columns: ["vocabulary_id"]
            isOneToOne: false
            referencedRelation: "vocabulary"
            referencedColumns: ["id"]
          },
        ]
      }
      game_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string | null
          game_id: string
          id: string
          max_score: number
          score: number
          time_taken: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          game_id: string
          id?: string
          max_score: number
          score?: number
          time_taken?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          game_id?: string
          id?: string
          max_score?: number
          score?: number
          time_taken?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_attempts_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "interactive_games"
            referencedColumns: ["id"]
          },
        ]
      }
      idioms: {
        Row: {
          created_at: string
          created_by: string | null
          difficulty_level: number | null
          english_meaning: string
          gujarati_idioms: string
          gujarati_word: string
          id: string
          updated_at: string
          usage_example_english: string
          usage_example_gujarati: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          difficulty_level?: number | null
          english_meaning: string
          gujarati_idioms: string
          gujarati_word: string
          id?: string
          updated_at?: string
          usage_example_english: string
          usage_example_gujarati: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          difficulty_level?: number | null
          english_meaning?: string
          gujarati_idioms?: string
          gujarati_word?: string
          id?: string
          updated_at?: string
          usage_example_english?: string
          usage_example_gujarati?: string
        }
        Relationships: []
      }
      interactive_games: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: number | null
          game_data: Json
          game_type: string
          id: string
          max_score: number | null
          time_limit: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          game_data: Json
          game_type: string
          id?: string
          max_score?: number | null
          time_limit?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          game_data?: Json
          game_type?: string
          id?: string
          max_score?: number | null
          time_limit?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      learning_progress: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          is_learned: boolean | null
          last_reviewed: string | null
          learned_at: string | null
          times_reviewed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          is_learned?: boolean | null
          last_reviewed?: string | null
          learned_at?: string | null
          times_reviewed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          is_learned?: boolean | null
          last_reviewed?: string | null
          learned_at?: string | null
          times_reviewed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string
          text_content: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url: string
          text_content?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string
          text_content?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          dialogue_id: string
          feedback: Json | null
          id: string
          score: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          dialogue_id: string
          feedback?: Json | null
          id?: string
          score?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          dialogue_id?: string
          feedback?: Json | null
          id?: string
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_dialogue_id_fkey"
            columns: ["dialogue_id"]
            isOneToOne: false
            referencedRelation: "dialogues"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          current_streak: number | null
          display_name: string | null
          email: string | null
          id: string
          last_login_date: string | null
          points: number | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          display_name?: string | null
          email?: string | null
          id?: string
          last_login_date?: string | null
          points?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          display_name?: string | null
          email?: string | null
          id?: string
          last_login_date?: string | null
          points?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string
          id: string
          max_score: number
          quiz_id: string
          score: number
          time_taken: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string
          id?: string
          max_score: number
          quiz_id: string
          score: number
          time_taken?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string
          id?: string
          max_score?: number
          quiz_id?: string
          score?: number
          time_taken?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty_level: number | null
          id: string
          questions: Json
          quiz_type: string
          time_limit: number | null
          title: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          id?: string
          questions: Json
          quiz_type: string
          time_limit?: number | null
          title: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          id?: string
          questions?: Json
          quiz_type?: string
          time_limit?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      synonyms: {
        Row: {
          created_at: string
          created_by: string | null
          difficulty_level: number | null
          english_meaning: string
          gujarati_synonyms: string
          gujarati_word: string
          id: string
          updated_at: string
          usage_example_english: string
          usage_example_gujarati: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          difficulty_level?: number | null
          english_meaning: string
          gujarati_synonyms: string
          gujarati_word: string
          id?: string
          updated_at?: string
          usage_example_english: string
          usage_example_gujarati: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          difficulty_level?: number | null
          english_meaning?: string
          gujarati_synonyms?: string
          gujarati_word?: string
          id?: string
          updated_at?: string
          usage_example_english?: string
          usage_example_gujarati?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary: {
        Row: {
          audio_url: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          difficulty_level: number | null
          english_word: string
          gujarati_transliteration: string | null
          gujarati_word: string
          id: string
          image_url: string | null
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          difficulty_level?: number | null
          english_word: string
          gujarati_transliteration?: string | null
          gujarati_word: string
          id?: string
          image_url?: string | null
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          difficulty_level?: number | null
          english_word?: string
          gujarati_transliteration?: string | null
          gujarati_word?: string
          id?: string
          image_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      word_bank: {
        Row: {
          created_at: string | null
          created_by: string | null
          difficulty_level: number | null
          english_meaning: string | null
          english_word: string
          example_sentence_english: string | null
          example_sentence_gujarati: string | null
          gujarati_meaning: string | null
          gujarati_word: string
          id: string
          updated_at: string | null
          word_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          difficulty_level?: number | null
          english_meaning?: string | null
          english_word: string
          example_sentence_english?: string | null
          example_sentence_gujarati?: string | null
          gujarati_meaning?: string | null
          gujarati_word: string
          id?: string
          updated_at?: string | null
          word_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          difficulty_level?: number | null
          english_meaning?: string | null
          english_word?: string
          example_sentence_english?: string | null
          example_sentence_gujarati?: string | null
          gujarati_meaning?: string | null
          gujarati_word?: string
          id?: string
          updated_at?: string | null
          word_type?: string
        }
        Relationships: []
      }
      word_progress: {
        Row: {
          created_at: string
          id: string
          is_learned: boolean | null
          last_reviewed: string | null
          learned_at: string | null
          times_reviewed: number | null
          updated_at: string
          user_id: string
          word_id: string
          word_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_learned?: boolean | null
          last_reviewed?: string | null
          learned_at?: string | null
          times_reviewed?: number | null
          updated_at?: string
          user_id: string
          word_id: string
          word_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_learned?: boolean | null
          last_reviewed?: string | null
          learned_at?: string | null
          times_reviewed?: number | null
          updated_at?: string
          user_id?: string
          word_id?: string
          word_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      handle_daily_login: {
        Args: { user_id_param: string }
        Returns: {
          is_new_login: boolean
          points_earned: number
          streak_count: number
        }[]
      }
    }
    Enums: {
      user_role: "student" | "teacher"
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
    Enums: {
      user_role: ["student", "teacher"],
    },
  },
} as const
