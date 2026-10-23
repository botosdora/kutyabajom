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
      allergies: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          pet_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          pet_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          pet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "allergies_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      conditions: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          diagnosed_on: string | null
          id: string
          name: string
          notes: string | null
          pet_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          diagnosed_on?: string | null
          id?: string
          name: string
          notes?: string | null
          pet_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          diagnosed_on?: string | null
          id?: string
          name?: string
          notes?: string | null
          pet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conditions_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          id: string
          kind: string
          pet_id: string
          title: string
          vet_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date: string
          id?: string
          kind?: string
          pet_id: string
          title: string
          vet_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          id?: string
          kind?: string
          pet_id?: string
          title?: string
          vet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_events_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_events_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "vets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_members: {
        Row: {
          created_at: string
          pet_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          pet_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          pet_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_members_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          birth_date: string | null
          breed: string | null
          chip_number: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          sex: string | null
        }
        Insert: {
          birth_date?: string | null
          breed?: string | null
          chip_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          sex?: string | null
        }
        Update: {
          birth_date?: string | null
          breed?: string | null
          chip_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          sex?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          notifications_enabled: boolean
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          notifications_enabled?: boolean
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          notifications_enabled?: boolean
          phone?: string | null
        }
        Relationships: []
      }
      vaccinations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          pet_id: string
          product_name: string | null
          vaccinated_on: string
          vaccine: string
          valid_until: string | null
          vet_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          pet_id: string
          product_name?: string | null
          vaccinated_on: string
          vaccine: string
          valid_until?: string | null
          vet_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          pet_id?: string
          product_name?: string | null
          vaccinated_on?: string
          vaccine?: string
          valid_until?: string | null
          vet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccinations_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "vets"
            referencedColumns: ["id"]
          },
        ]
      }
      vets: {
        Row: {
          address: string | null
          clinic: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          pet_id: string
          phone: string | null
          specialty: string | null
        }
        Insert: {
          address?: string | null
          clinic?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          pet_id: string
          phone?: string | null
          specialty?: string | null
        }
        Update: {
          address?: string | null
          clinic?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          pet_id?: string
          phone?: string | null
          specialty?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vets_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      weights: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          measured_on: string
          note: string | null
          pet_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          measured_on?: string
          note?: string | null
          pet_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          measured_on?: string
          note?: string | null
          pet_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weights_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_pet_member: {
        Args: { p_email: string; p_pet_id: string }
        Returns: string
      }
      create_pet: {
        Args: {
          p_birth_date?: string
          p_breed?: string
          p_chip_number?: string
          p_name: string
          p_sex?: string
        }
        Returns: string
      }
      is_pet_member: { Args: { p_pet_id: string }; Returns: boolean }
      is_pet_owner: { Args: { p_pet_id: string }; Returns: boolean }
      pet_member_list: {
        Args: { p_pet_id: string }
        Returns: {
          email: string
          full_name: string
          role: string
          user_id: string
        }[]
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
  public: {
    Enums: {},
  },
} as const

