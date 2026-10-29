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
      calendar_events: {
        Row: {
          category: string
          completed_on: string | null
          created_at: string
          created_by: string | null
          event_date: string
          event_time: string | null
          id: string
          location: string | null
          medical_event_id: string | null
          notes: string | null
          pet_id: string
          repeat_interval: number | null
          repeat_rule: string | null
          series_id: string | null
          status: string
          task_type_id: string | null
          title: string
          vaccination_id: string | null
          vet_id: string | null
          vet_type: string | null
        }
        Insert: {
          category: string
          completed_on?: string | null
          created_at?: string
          created_by?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          location?: string | null
          medical_event_id?: string | null
          notes?: string | null
          pet_id: string
          repeat_interval?: number | null
          repeat_rule?: string | null
          series_id?: string | null
          status?: string
          task_type_id?: string | null
          title: string
          vaccination_id?: string | null
          vet_id?: string | null
          vet_type?: string | null
        }
        Update: {
          category?: string
          completed_on?: string | null
          created_at?: string
          created_by?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          location?: string | null
          medical_event_id?: string | null
          notes?: string | null
          pet_id?: string
          repeat_interval?: number | null
          repeat_rule?: string | null
          series_id?: string | null
          status?: string
          task_type_id?: string | null
          title?: string
          vaccination_id?: string | null
          vet_id?: string | null
          vet_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_medical_event_id_fkey"
            columns: ["medical_event_id"]
            isOneToOne: false
            referencedRelation: "medical_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_vaccination_id_fkey"
            columns: ["vaccination_id"]
            isOneToOne: false
            referencedRelation: "vaccinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "vets"
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
      daily_logs: {
        Row: {
          activity: number | null
          appetite: number | null
          created_by: string | null
          day: string
          id: string
          mood: number | null
          notes: string | null
          observations: string[]
          pain: number | null
          pain_duration: string | null
          pet_id: string
          stool: string | null
          updated_at: string
          water: number | null
          water_ml: number | null
        }
        Insert: {
          activity?: number | null
          appetite?: number | null
          created_by?: string | null
          day: string
          id?: string
          mood?: number | null
          notes?: string | null
          observations?: string[]
          pain?: number | null
          pain_duration?: string | null
          pet_id: string
          stool?: string | null
          updated_at?: string
          water?: number | null
          water_ml?: number | null
        }
        Update: {
          activity?: number | null
          appetite?: number | null
          created_by?: string | null
          day?: string
          id?: string
          mood?: number | null
          notes?: string | null
          observations?: string[]
          pain?: number | null
          pain_duration?: string | null
          pet_id?: string
          stool?: string | null
          updated_at?: string
          water?: number | null
          water_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          created_by: string | null
          doc_type: string
          document_date: string
          file_name: string
          id: string
          medical_event_id: string | null
          mime_type: string | null
          pet_id: string
          size_bytes: number | null
          storage_path: string
          tags: string[]
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doc_type?: string
          document_date?: string
          file_name: string
          id?: string
          medical_event_id?: string | null
          mime_type?: string | null
          pet_id: string
          size_bytes?: number | null
          storage_path: string
          tags?: string[]
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doc_type?: string
          document_date?: string
          file_name?: string
          id?: string
          medical_event_id?: string | null
          mime_type?: string | null
          pet_id?: string
          size_bytes?: number | null
          storage_path?: string
          tags?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_medical_event_id_fkey"
            columns: ["medical_event_id"]
            isOneToOne: false
            referencedRelation: "medical_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      dose_logs: {
        Row: {
          created_at: string
          created_by: string | null
          given_at: string | null
          id: string
          medication_id: string
          note: string | null
          pet_id: string
          scheduled_for: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          given_at?: string | null
          id?: string
          medication_id: string
          note?: string | null
          pet_id: string
          scheduled_for: string
          status: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          given_at?: string | null
          id?: string
          medication_id?: string
          note?: string | null
          pet_id?: string
          scheduled_for?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "dose_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dose_logs_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount_huf: number
          calendar_event_id: string | null
          category: string
          created_at: string
          created_by: string | null
          id: string
          medical_event_id: string | null
          notes: string | null
          pet_id: string
          spent_on: string
          title: string
        }
        Insert: {
          amount_huf: number
          calendar_event_id?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          medical_event_id?: string | null
          notes?: string | null
          pet_id: string
          spent_on?: string
          title: string
        }
        Update: {
          amount_huf?: number
          calendar_event_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          medical_event_id?: string | null
          notes?: string | null
          pet_id?: string
          spent_on?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_calendar_event_id_fkey"
            columns: ["calendar_event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_medical_event_id_fkey"
            columns: ["medical_event_id"]
            isOneToOne: false
            referencedRelation: "medical_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      food_purchases: {
        Row: {
          cost_huf: number | null
          created_at: string
          created_by: string | null
          food_id: string
          id: string
          pet_id: string
          purchased_on: string
          quantity: string | null
        }
        Insert: {
          cost_huf?: number | null
          created_at?: string
          created_by?: string | null
          food_id: string
          id?: string
          pet_id: string
          purchased_on?: string
          quantity?: string | null
        }
        Update: {
          cost_huf?: number | null
          created_at?: string
          created_by?: string | null
          food_id?: string
          id?: string
          pet_id?: string
          purchased_on?: string
          quantity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_purchases_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_purchases_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          created_at: string
          created_by: string | null
          daily_grams: number | null
          fail_reason: string | null
          food_type: string | null
          id: string
          kind: string
          name: string
          notes: string | null
          pet_id: string
          reorder_on: string | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          daily_grams?: number | null
          fail_reason?: string | null
          food_type?: string | null
          id?: string
          kind?: string
          name: string
          notes?: string | null
          pet_id: string
          reorder_on?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          daily_grams?: number | null
          fail_reason?: string | null
          food_type?: string | null
          id?: string
          kind?: string
          name?: string
          notes?: string | null
          pet_id?: string
          reorder_on?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "foods_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string
          note: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string
          expires_at?: string
          note?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          note?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      lab_results: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          measured_on: string
          medical_event_id: string | null
          note: string | null
          parameter: string
          pet_id: string
          ref_high: number | null
          ref_low: number | null
          unit: string | null
          value: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          measured_on: string
          medical_event_id?: string | null
          note?: string | null
          parameter: string
          pet_id: string
          ref_high?: number | null
          ref_low?: number | null
          unit?: string | null
          value: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          measured_on?: string
          medical_event_id?: string | null
          note?: string | null
          parameter?: string
          pet_id?: string
          ref_high?: number | null
          ref_low?: number | null
          unit?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_medical_event_id_fkey"
            columns: ["medical_event_id"]
            isOneToOne: false
            referencedRelation: "medical_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          created_by: string | null
          day: string
          id: string
          logged_at: string
          meal: string
          note: string | null
          pet_id: string
          status: string
        }
        Insert: {
          created_by?: string | null
          day: string
          id?: string
          logged_at?: string
          meal: string
          note?: string | null
          pet_id: string
          status: string
        }
        Update: {
          created_by?: string | null
          day?: string
          id?: string
          logged_at?: string
          meal?: string
          note?: string | null
          pet_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_logs_pet_id_fkey"
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
      medication_periods: {
        Row: {
          created_at: string
          created_by: string | null
          dosage: string | null
          end_date: string | null
          id: string
          interval_days: number
          medication_id: string
          pet_id: string
          start_date: string
          stop_reason: string | null
          times: string[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dosage?: string | null
          end_date?: string | null
          id?: string
          interval_days?: number
          medication_id: string
          pet_id: string
          start_date: string
          stop_reason?: string | null
          times?: string[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dosage?: string | null
          end_date?: string | null
          id?: string
          interval_days?: number
          medication_id?: string
          pet_id?: string
          start_date?: string
          stop_reason?: string | null
          times?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "medication_periods_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_periods_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_purchases: {
        Row: {
          cost_huf: number | null
          created_at: string
          created_by: string | null
          id: string
          medication_id: string
          notes: string | null
          pet_id: string
          purchased_on: string
          quantity: string | null
        }
        Insert: {
          cost_huf?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          medication_id: string
          notes?: string | null
          pet_id: string
          purchased_on?: string
          quantity?: string | null
        }
        Update: {
          cost_huf?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          medication_id?: string
          notes?: string | null
          pet_id?: string
          purchased_on?: string
          quantity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_purchases_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_purchases_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean
          category: string
          created_at: string
          created_by: string | null
          dosage: string | null
          id: string
          name: string
          notes: string | null
          pet_id: string
          reorder_on: string | null
          schedule_type: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          created_by?: string | null
          dosage?: string | null
          id?: string
          name: string
          notes?: string | null
          pet_id: string
          reorder_on?: string | null
          schedule_type?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          created_by?: string | null
          dosage?: string | null
          id?: string
          name?: string
          notes?: string | null
          pet_id?: string
          reorder_on?: string | null
          schedule_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          dedupe_key: string
          sent_at: string
          user_id: string
        }
        Insert: {
          dedupe_key: string
          sent_at?: string
          user_id: string
        }
        Update: {
          dedupe_key?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_requests: {
        Row: {
          created_at: string
          id: string
          processed_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          processed_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          processed_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          adoption_date: string | null
          birth_date: string | null
          breakfast_time: string
          breed: string | null
          chip_number: string | null
          created_at: string
          created_by: string | null
          dinner_time: string
          id: string
          name: string
          notes: string | null
          photo_path: string | null
          sex: string | null
        }
        Insert: {
          adoption_date?: string | null
          birth_date?: string | null
          breakfast_time?: string
          breed?: string | null
          chip_number?: string | null
          created_at?: string
          created_by?: string | null
          dinner_time?: string
          id?: string
          name: string
          notes?: string | null
          photo_path?: string | null
          sex?: string | null
        }
        Update: {
          adoption_date?: string | null
          birth_date?: string | null
          breakfast_time?: string
          breed?: string | null
          chip_number?: string | null
          created_at?: string
          created_by?: string | null
          dinner_time?: string
          id?: string
          name?: string
          notes?: string | null
          photo_path?: string | null
          sex?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          daily_reminder_time: string
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean
          notifications_enabled: boolean
          notify_doses: boolean
          notify_reminders: boolean
          phone: string | null
        }
        Insert: {
          created_at?: string
          daily_reminder_time?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean
          notifications_enabled?: boolean
          notify_doses?: boolean
          notify_reminders?: boolean
          phone?: string | null
        }
        Update: {
          created_at?: string
          daily_reminder_time?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean
          notifications_enabled?: boolean
          notify_doses?: boolean
          notify_reminders?: boolean
          phone?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id?: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      task_types: {
        Row: {
          created_at: string
          id: string
          name: string
          pet_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          pet_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          pet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_types_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
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
          body_condition: number | null
          created_at: string
          created_by: string | null
          id: string
          measured_on: string
          note: string | null
          pet_id: string
          weight_kg: number
        }
        Insert: {
          body_condition?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          measured_on?: string
          note?: string | null
          pet_id: string
          weight_kg: number
        }
        Update: {
          body_condition?: number | null
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
      all_expenses: {
        Row: {
          amount_huf: number | null
          category: string | null
          id: string | null
          medical_event_id: string | null
          medication_id: string | null
          notes: string | null
          pet_id: string | null
          source: string | null
          spent_on: string | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_pet_member: {
        Args: { p_email: string; p_pet_id: string }
        Returns: string
      }
      admin_set_suspended: {
        Args: { p_suspended: boolean; p_user_id: string }
        Returns: undefined
      }
      admin_sole_owned_pets: {
        Args: { p_user_id: string }
        Returns: {
          pet_id: string
        }[]
      }
      admin_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_admin: boolean
          last_sign_in_at: string
          pets: number
          storage_bytes: number
          suspended: boolean
        }[]
      }
      claim_notifications: {
        Args: { p_now: string }
        Returns: {
          auth: string
          body: string
          dedupe_key: string
          endpoint: string
          p256dh: string
          subscription_id: string
          title: string
          url: string
        }[]
      }
      create_invite: { Args: { p_note?: string }; Returns: string }
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
      due_notifications: {
        Args: { p_now: string }
        Returns: {
          body: string
          dedupe_key: string
          title: string
          url: string
          user_id: string
        }[]
      }
      invite_is_valid: { Args: { p_code: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
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
      save_push_subscription: {
        Args: {
          p_auth: string
          p_endpoint: string
          p_p256dh: string
          p_user_agent: string
        }
        Returns: undefined
      }
      scheduled_doses: {
        Args: { p_from: string; p_pet_id: string; p_to: string }
        Returns: {
          category: string
          day: string
          dosage: string
          given_at: string
          log_id: string
          medication_id: string
          name: string
          scheduled_for: string
          status: string
        }[]
      }
      storage_usage: {
        Args: never
        Returns: {
          bucket: string
          bytes: number
          files: number
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
