
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
      attendance: {
        Row: {
          attendance_date: string
          attendance_id: string
          browser_info: string | null
          clock_in: string | null
          clock_out: string | null
          created_at: string
          device_info: string | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          notes: string | null
          permission_type: Database["public"]["Enums"]["permission_type"]
          profile_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
        }
        Insert: {
          attendance_date?: string
          attendance_id?: string
          browser_info?: string | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          device_info?: string | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          notes?: string | null
          permission_type?: Database["public"]["Enums"]["permission_type"]
          profile_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          attendance_id?: string
          browser_info?: string | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          device_info?: string | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          notes?: string | null
          permission_type?: Database["public"]["Enums"]["permission_type"]
          profile_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          created_at: string
          customer_name: string
          final_reason: string | null
          lead_date: string
          lead_id: string
          lead_source: string | null
          lead_status: string
          profile_id: string | null
          slik_id: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          customer_name: string
          final_reason?: string | null
          lead_date?: string
          lead_id?: string
          lead_source?: string | null
          lead_status?: string
          profile_id?: string | null
          slik_id?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string
          final_reason?: string | null
          lead_date?: string
          lead_id?: string
          lead_source?: string | null
          lead_status?: string
          profile_id?: string | null
          slik_id?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_slik_id_fkey"
            columns: ["slik_id"]
            isOneToOne: false
            referencedRelation: "sliks"
            referencedColumns: ["slik_id"]
          },
        ]
      }
      profiles: {
        Row: {
          alias: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          job_title: string | null
          photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string | null
          updated_at: string
          username: string
          whatsapp: string | null
        }
        Insert: {
          alias?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          job_title?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string
          username: string
          whatsapp?: string | null
        }
        Update: {
          alias?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          job_title?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string
          username?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      report_ads: {
        Row: {
          ai_summary: string | null
          campaign_name: string
          cpr: number | null
          created_at: string
          ctr: number | null
          leads_count: number
          marketing_id: string
          platform: Database["public"]["Enums"]["ad_platform"]
          report_ads_id: string
          report_date: string
          total_spend: number
        }
        Insert: {
          ai_summary?: string | null
          campaign_name: string
          cpr?: number | null
          created_at?: string
          ctr?: number | null
          leads_count?: number
          marketing_id: string
          platform: Database["public"]["Enums"]["ad_platform"]
          report_ads_id?: string
          report_date?: string
          total_spend?: number
        }
        Update: {
          ai_summary?: string | null
          campaign_name?: string
          cpr?: number | null
          created_at?: string
          ctr?: number | null
          leads_count?: number
          marketing_id?: string
          platform?: Database["public"]["Enums"]["ad_platform"]
          report_ads_id?: string
          report_date?: string
          total_spend?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_ads_marketing_id_fkey"
            columns: ["marketing_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_leads: {
        Row: {
          ai_summary: string | null
          call_count: number
          created_at: string
          notes: string | null
          profile_id: string
          report_date: string
          report_id: string
          slik_count: number
          total_leads: number
          updated_at: string
          visit_count: number
        }
        Insert: {
          ai_summary?: string | null
          call_count?: number
          created_at?: string
          notes?: string | null
          profile_id: string
          report_date?: string
          report_id?: string
          slik_count?: number
          total_leads?: number
          updated_at?: string
          visit_count?: number
        }
        Update: {
          ai_summary?: string | null
          call_count?: number
          created_at?: string
          notes?: string | null
          profile_id?: string
          report_date?: string
          report_id?: string
          slik_count?: number
          total_leads?: number
          updated_at?: string
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_leads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sliks: {
        Row: {
          address: string | null
          birth_date: string | null
          birth_place: string | null
          blood_type: string | null
          created_at: string
          created_by: string
          district: string | null
          expiry_date: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          ktp_image_url: string | null
          marital_status:
            | Database["public"]["Enums"]["marital_status_type"]
            | null
          nationality: string | null
          nik: string
          occupation: string | null
          religion: string | null
          rt: string | null
          rw: string | null
          slik_id: string
          status: Database["public"]["Enums"]["slik_status"]
          updated_at: string
          village: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          birth_place?: string | null
          blood_type?: string | null
          created_at?: string
          created_by: string
          district?: string | null
          expiry_date?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          ktp_image_url?: string | null
          marital_status?:
            | Database["public"]["Enums"]["marital_status_type"]
            | null
          nationality?: string | null
          nik: string
          occupation?: string | null
          religion?: string | null
          rt?: string | null
          rw?: string | null
          slik_id?: string
          status?: Database["public"]["Enums"]["slik_status"]
          updated_at?: string
          village?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          birth_place?: string | null
          blood_type?: string | null
          created_at?: string
          created_by?: string
          district?: string | null
          expiry_date?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          ktp_image_url?: string | null
          marital_status?:
            | Database["public"]["Enums"]["marital_status_type"]
            | null
          nationality?: string | null
          nik?: string
          occupation?: string | null
          religion?: string | null
          rt?: string | null
          rw?: string | null
          slik_id?: string
          status?: Database["public"]["Enums"]["slik_status"]
          updated_at?: string
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sliks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ad_platform: "Facebook" | "FB Ads" | "Google" | "TikTok" | "Instagram"
      attendance_status: "present" | "late" | "sick" | "permission" | "leave"
      gender_type: "LAKI-LAKI" | "PEREMPUAN"
      marital_status_type:
        | "BELUM KAWIN"
        | "KAWIN"
        | "CERAI HIDUP"
        | "CERAI MATI"
      permission_type: "halfday" | "fullday" | "none"
      slik_status: "pending" | "approved" | "rejected"
      user_role:
        | "Inhouse"
        | "Refferal"
        | "Agency"
        | "Manajer"
        | "Staff Ops"
        | "Administrator"
        | "SuperAdmin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
 
// To generate this file, run:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/supabase.ts
