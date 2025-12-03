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
          created_at: string
          id: string
          name: string
          passcode: string | null
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
          created_at?: string
          id?: string
          name: string
          passcode?: string | null
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
          created_at?: string
          id?: string
          name?: string
          passcode?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deal_has_passcode: { Args: { deal_id_text: string }; Returns: boolean }
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
