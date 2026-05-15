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
      dd_categories: {
        Row: {
          category_no: number
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category_no: number
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category_no?: number
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      deal_access_tokens: {
        Row: {
          created_at: string
          deal_id: string
          expires_at: string
          id: string
          ip_address: string | null
          token_hash: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          deal_id: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          token_hash: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          deal_id?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          token_hash?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_access_tokens_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_categories: {
        Row: {
          category_code: string
          category_order: number
          created_at: string
          deal_id: string
          id: string
          title: string
        }
        Insert: {
          category_code: string
          category_order: number
          created_at?: string
          deal_id: string
          id?: string
          title: string
        }
        Update: {
          category_code?: string
          category_order?: number
          created_at?: string
          deal_id?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_categories_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_documents: {
        Row: {
          category: string | null
          deal_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          notes: string | null
          task_id: string | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          deal_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          notes?: string | null
          task_id?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          deal_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          notes?: string | null
          task_id?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_documents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "deal_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_specialists: {
        Row: {
          category_id: string
          created_at: string
          deal_id: string
          email: string
          id: string
          name: string
          role: string
        }
        Insert: {
          category_id: string
          created_at?: string
          deal_id: string
          email: string
          id?: string
          name: string
          role: string
        }
        Update: {
          category_id?: string
          created_at?: string
          deal_id?: string
          email?: string
          id?: string
          name?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_specialists_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "deal_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_specialists_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_tasks: {
        Row: {
          assigned_email: string | null
          assigned_to: string | null
          category_id: string
          checked: boolean
          created_at: string
          due_date: string | null
          has_attachment: boolean
          id: string
          notes: string | null
          priority: string
          status: string
          task_code: string
          task_order: number
          title: string
          updated_at: string
        }
        Insert: {
          assigned_email?: string | null
          assigned_to?: string | null
          category_id: string
          checked?: boolean
          created_at?: string
          due_date?: string | null
          has_attachment?: boolean
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          task_code: string
          task_order: number
          title: string
          updated_at?: string
        }
        Update: {
          assigned_email?: string | null
          assigned_to?: string | null
          category_id?: string
          checked?: boolean
          created_at?: string
          due_date?: string | null
          has_attachment?: boolean
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          task_code?: string
          task_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "deal_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_team_members: {
        Row: {
          contact_number: string
          created_at: string
          deal_id: string
          email: string
          full_name: string
          id: string
          permission_level: string
          role: string
          updated_at: string
        }
        Insert: {
          contact_number: string
          created_at?: string
          deal_id: string
          email: string
          full_name: string
          id?: string
          permission_level: string
          role: string
          updated_at?: string
        }
        Update: {
          contact_number?: string
          created_at?: string
          deal_id?: string
          email?: string
          full_name?: string
          id?: string
          permission_level?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          buyer_email: string | null
          buyer_legal_email: string | null
          buyer_legal_name: string | null
          buyer_name: string | null
          confidentiality_level: string | null
          created_at: string
          deal_code: string
          deal_stage: string | null
          deal_value: string | null
          id: string
          industry: string | null
          lead_advisor: string | null
          name: string
          passcode: string | null
          selected_categories: string[] | null
          seller_email: string | null
          seller_legal_email: string | null
          seller_legal_name: string | null
          seller_name: string | null
          status: string
          target_close_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          buyer_email?: string | null
          buyer_legal_email?: string | null
          buyer_legal_name?: string | null
          buyer_name?: string | null
          confidentiality_level?: string | null
          created_at?: string
          deal_code: string
          deal_stage?: string | null
          deal_value?: string | null
          id?: string
          industry?: string | null
          lead_advisor?: string | null
          name: string
          passcode?: string | null
          selected_categories?: string[] | null
          seller_email?: string | null
          seller_legal_email?: string | null
          seller_legal_name?: string | null
          seller_name?: string | null
          status?: string
          target_close_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          buyer_email?: string | null
          buyer_legal_email?: string | null
          buyer_legal_name?: string | null
          buyer_name?: string | null
          confidentiality_level?: string | null
          created_at?: string
          deal_code?: string
          deal_stage?: string | null
          deal_value?: string | null
          id?: string
          industry?: string | null
          lead_advisor?: string | null
          name?: string
          passcode?: string | null
          selected_categories?: string[] | null
          seller_email?: string | null
          seller_legal_email?: string | null
          seller_legal_name?: string | null
          seller_name?: string | null
          status?: string
          target_close_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expert_access_log: {
        Row: {
          accessed_at: string | null
          code_id: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string | null
          code_id: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string | null
          code_id?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_access_log_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "expert_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_access_tokens: {
        Row: {
          code_id: string
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          token_hash: string
          user_agent: string | null
        }
        Insert: {
          code_id: string
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          token_hash: string
          user_agent?: string | null
        }
        Update: {
          code_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          token_hash?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_access_tokens_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "expert_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_codes: {
        Row: {
          category_id: string
          code: string
          created_at: string | null
          deal_id: string
          expert_email: string | null
          expert_name: string | null
          expires_at: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          last_accessed_at: string | null
        }
        Insert: {
          category_id: string
          code: string
          created_at?: string | null
          deal_id: string
          expert_email?: string | null
          expert_name?: string | null
          expires_at?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          last_accessed_at?: string | null
        }
        Update: {
          category_id?: string
          code?: string
          created_at?: string | null
          deal_id?: string
          expert_email?: string | null
          expert_name?: string | null
          expires_at?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          last_accessed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_codes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "dd_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_codes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_documents: {
        Row: {
          category_id: string
          code_id: string
          deal_id: string
          file_name: string
          file_size_bytes: number | null
          file_url: string
          id: string
          mime_type: string | null
          notes: string | null
          task_id: string | null
          uploaded_at: string | null
        }
        Insert: {
          category_id: string
          code_id: string
          deal_id: string
          file_name: string
          file_size_bytes?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          task_id?: string | null
          uploaded_at?: string | null
        }
        Update: {
          category_id?: string
          code_id?: string
          deal_id?: string
          file_name?: string
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          task_id?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "dd_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_documents_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "expert_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_documents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "expert_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_task_completions: {
        Row: {
          code_id: string
          completed_at: string | null
          id: string
          is_complete: boolean | null
          notes: string | null
          task_id: string
        }
        Insert: {
          code_id: string
          completed_at?: string | null
          id?: string
          is_complete?: boolean | null
          notes?: string | null
          task_id: string
        }
        Update: {
          code_id?: string
          completed_at?: string | null
          id?: string
          is_complete?: boolean | null
          notes?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_task_completions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "expert_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "expert_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_tasks: {
        Row: {
          category_id: string
          created_at: string | null
          deal_id: string
          description: string | null
          id: string
          is_required: boolean | null
          sort_order: number | null
          title: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          deal_id: string
          description?: string | null
          id?: string
          is_required?: boolean | null
          sort_order?: number | null
          title: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          deal_id?: string
          description?: string | null
          id?: string
          is_required?: boolean | null
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "dd_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          deal_id: string | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      passcode_attempts: {
        Row: {
          attempted_at: string
          deal_id: string
          id: string
          ip_address: string
          success: boolean
        }
        Insert: {
          attempted_at?: string
          deal_id: string
          id?: string
          ip_address: string
          success?: boolean
        }
        Update: {
          attempted_at?: string
          deal_id?: string
          id?: string
          ip_address?: string
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "passcode_attempts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_tokens: { Args: never; Returns: undefined }
      deal_exists: { Args: { deal_id_text: string }; Returns: boolean }
      deal_exists_uuid: { Args: { p_deal_id: string }; Returns: boolean }
      deal_has_passcode: { Args: { deal_id_text: string }; Returns: boolean }
      generate_deal_code: { Args: { deal_name: string }; Returns: string }
      generate_expert_access_code: {
        Args: { p_category_no: number }
        Returns: string
      }
      generate_expert_code_segment: { Args: never; Returns: string }
      generate_expert_codes_for_deal: {
        Args: { p_deal_id: string }
        Returns: number
      }
      regenerate_expert_code: { Args: { p_code_id: string }; Returns: string }
      register_expert_document: {
        Args: {
          p_access_token: string
          p_code_id: string
          p_file_name: string
          p_file_size_bytes?: number
          p_file_url: string
          p_mime_type?: string
          p_notes?: string
          p_task_id?: string
        }
        Returns: string
      }
      seed_expert_tasks_for_category: {
        Args: { p_category_id: string; p_deal_id: string }
        Returns: undefined
      }
      toggle_expert_task_completion: {
        Args: {
          p_access_token: string
          p_code_id: string
          p_is_complete: boolean
          p_task_id: string
        }
        Returns: boolean
      }
      validate_deal_access_token: {
        Args: { p_access_token: string; p_deal_id: string }
        Returns: boolean
      }
      validate_expert_access_token: {
        Args: { p_access_token: string; p_code_id: string }
        Returns: boolean
      }
      verify_deal_code: {
        Args: { p_deal_code: string; p_ip_address?: string }
        Returns: {
          access_token: string
          deal_uuid: string
          message: string
          success: boolean
        }[]
      }
      verify_deal_passcode:
        | {
            Args: {
              p_deal_id: string
              p_ip_address?: string
              p_passcode: string
            }
            Returns: {
              access_token: string
              deal_uuid: string
              message: string
              success: boolean
            }[]
          }
        | {
            Args: {
              p_deal_id: string
              p_ip_address?: string
              p_passcode: string
            }
            Returns: {
              access_token: string
              message: string
              success: boolean
            }[]
          }
      verify_expert_code: {
        Args: { p_code: string; p_ip_address?: string; p_user_agent?: string }
        Returns: {
          access_token: string
          category_id: string
          code_id: string
          deal_id: string
          expert_code: string
          message: string
          success: boolean
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
