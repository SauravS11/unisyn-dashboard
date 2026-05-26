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
      advisor_review_comments: {
        Row: {
          category_id: string | null
          client_intake_id: string
          comment_text: string
          comment_type: Database["public"]["Enums"]["advisor_comment_type"]
          created_at: string
          created_by: string
          document_id: string | null
          id: string
          requirement_id: string | null
          visible_to_respondent: boolean
        }
        Insert: {
          category_id?: string | null
          client_intake_id: string
          comment_text: string
          comment_type?: Database["public"]["Enums"]["advisor_comment_type"]
          created_at?: string
          created_by: string
          document_id?: string | null
          id?: string
          requirement_id?: string | null
          visible_to_respondent?: boolean
        }
        Update: {
          category_id?: string | null
          client_intake_id?: string
          comment_text?: string
          comment_type?: Database["public"]["Enums"]["advisor_comment_type"]
          created_at?: string
          created_by?: string
          document_id?: string | null
          id?: string
          requirement_id?: string | null
          visible_to_respondent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "advisor_review_comments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "due_diligence_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_review_comments_client_intake_id_fkey"
            columns: ["client_intake_id"]
            isOneToOne: false
            referencedRelation: "client_intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_review_comments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "client_requirement_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_review_comments_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "due_diligence_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      client_intake_categories: {
        Row: {
          advisor_notes: string | null
          advisor_status: string | null
          category_id: string
          client_intake_id: string
          created_at: string
          document_completion_percentage: number
          id: string
          overall_completion_percentage: number
          response_completion_percentage: number
          status: Database["public"]["Enums"]["intake_category_status"]
          updated_at: string
        }
        Insert: {
          advisor_notes?: string | null
          advisor_status?: string | null
          category_id: string
          client_intake_id: string
          created_at?: string
          document_completion_percentage?: number
          id?: string
          overall_completion_percentage?: number
          response_completion_percentage?: number
          status?: Database["public"]["Enums"]["intake_category_status"]
          updated_at?: string
        }
        Update: {
          advisor_notes?: string | null
          advisor_status?: string | null
          category_id?: string
          client_intake_id?: string
          created_at?: string
          document_completion_percentage?: number
          id?: string
          overall_completion_percentage?: number
          response_completion_percentage?: number
          status?: Database["public"]["Enums"]["intake_category_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_intake_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "due_diligence_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_intake_categories_client_intake_id_fkey"
            columns: ["client_intake_id"]
            isOneToOne: false
            referencedRelation: "client_intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      client_intakes: {
        Row: {
          advisor_notes: string | null
          client_type: Database["public"]["Enums"]["intake_client_type"]
          company_name: string
          converted_deal_id: string | null
          country: string | null
          created_at: string
          created_by: string
          due_date: string | null
          entity_type: string | null
          id: string
          industry: string | null
          intake_approved_at: string | null
          intake_code: string
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          primary_contact_role: string | null
          registration_number: string | null
          sector: string | null
          secure_link_token: string
          status: Database["public"]["Enums"]["intake_status"]
          updated_at: string
        }
        Insert: {
          advisor_notes?: string | null
          client_type: Database["public"]["Enums"]["intake_client_type"]
          company_name: string
          converted_deal_id?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          due_date?: string | null
          entity_type?: string | null
          id?: string
          industry?: string | null
          intake_approved_at?: string | null
          intake_code: string
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          primary_contact_role?: string | null
          registration_number?: string | null
          sector?: string | null
          secure_link_token: string
          status?: Database["public"]["Enums"]["intake_status"]
          updated_at?: string
        }
        Update: {
          advisor_notes?: string | null
          client_type?: Database["public"]["Enums"]["intake_client_type"]
          company_name?: string
          converted_deal_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          due_date?: string | null
          entity_type?: string | null
          id?: string
          industry?: string | null
          intake_approved_at?: string | null
          intake_code?: string
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          primary_contact_role?: string | null
          registration_number?: string | null
          sector?: string | null
          secure_link_token?: string
          status?: Database["public"]["Enums"]["intake_status"]
          updated_at?: string
        }
        Relationships: []
      }
      client_requirement_documents: {
        Row: {
          category_id: string
          client_intake_id: string
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          replaces_document_id: string | null
          requirement_id: string
          status: Database["public"]["Enums"]["intake_document_status"]
          updated_at: string
          upload_comment: string | null
          uploaded_at: string
          uploaded_by_email: string | null
          version: number
        }
        Insert: {
          category_id: string
          client_intake_id: string
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          replaces_document_id?: string | null
          requirement_id: string
          status?: Database["public"]["Enums"]["intake_document_status"]
          updated_at?: string
          upload_comment?: string | null
          uploaded_at?: string
          uploaded_by_email?: string | null
          version?: number
        }
        Update: {
          category_id?: string
          client_intake_id?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          replaces_document_id?: string | null
          requirement_id?: string
          status?: Database["public"]["Enums"]["intake_document_status"]
          updated_at?: string
          upload_comment?: string | null
          uploaded_at?: string
          uploaded_by_email?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_requirement_documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "due_diligence_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_requirement_documents_client_intake_id_fkey"
            columns: ["client_intake_id"]
            isOneToOne: false
            referencedRelation: "client_intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_requirement_documents_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "due_diligence_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      client_requirement_responses: {
        Row: {
          applicable_status: string | null
          category_id: string
          client_intake_id: string
          comment: string | null
          created_at: string
          id: string
          requirement_id: string
          response_value: string | null
          status: Database["public"]["Enums"]["requirement_status"]
          submitted_at: string | null
          updated_at: string
          yes_no_value: boolean | null
        }
        Insert: {
          applicable_status?: string | null
          category_id: string
          client_intake_id: string
          comment?: string | null
          created_at?: string
          id?: string
          requirement_id: string
          response_value?: string | null
          status?: Database["public"]["Enums"]["requirement_status"]
          submitted_at?: string | null
          updated_at?: string
          yes_no_value?: boolean | null
        }
        Update: {
          applicable_status?: string | null
          category_id?: string
          client_intake_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          requirement_id?: string
          response_value?: string | null
          status?: Database["public"]["Enums"]["requirement_status"]
          submitted_at?: string | null
          updated_at?: string
          yes_no_value?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "client_requirement_responses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "due_diligence_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_requirement_responses_client_intake_id_fkey"
            columns: ["client_intake_id"]
            isOneToOne: false
            referencedRelation: "client_intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_requirement_responses_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "due_diligence_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
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
          client_company_name: string | null
          client_type: string | null
          confidentiality_level: string | null
          created_at: string
          deal_code: string
          deal_stage: string | null
          deal_value: string | null
          id: string
          industry: string | null
          intake_approved_at: string | null
          lead_advisor: string | null
          name: string
          passcode: string | null
          selected_categories: string[] | null
          seller_email: string | null
          seller_legal_email: string | null
          seller_legal_name: string | null
          seller_name: string | null
          source_intake_id: string | null
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
          client_company_name?: string | null
          client_type?: string | null
          confidentiality_level?: string | null
          created_at?: string
          deal_code: string
          deal_stage?: string | null
          deal_value?: string | null
          id?: string
          industry?: string | null
          intake_approved_at?: string | null
          lead_advisor?: string | null
          name: string
          passcode?: string | null
          selected_categories?: string[] | null
          seller_email?: string | null
          seller_legal_email?: string | null
          seller_legal_name?: string | null
          seller_name?: string | null
          source_intake_id?: string | null
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
          client_company_name?: string | null
          client_type?: string | null
          confidentiality_level?: string | null
          created_at?: string
          deal_code?: string
          deal_stage?: string | null
          deal_value?: string | null
          id?: string
          industry?: string | null
          intake_approved_at?: string | null
          lead_advisor?: string | null
          name?: string
          passcode?: string | null
          selected_categories?: string[] | null
          seller_email?: string | null
          seller_legal_email?: string | null
          seller_legal_name?: string | null
          seller_name?: string | null
          source_intake_id?: string | null
          status?: string
          target_close_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_source_intake_id_fkey"
            columns: ["source_intake_id"]
            isOneToOne: false
            referencedRelation: "client_intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      due_diligence_categories: {
        Row: {
          category_code: string
          category_name: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
        }
        Insert: {
          category_code: string
          category_name: string
          created_at?: string
          description?: string | null
          display_order: number
          id?: string
          is_active?: boolean
        }
        Update: {
          category_code?: string
          category_name?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      due_diligence_requirements: {
        Row: {
          category_id: string
          created_at: string
          display_order: number
          help_text: string | null
          id: string
          input_type: Database["public"]["Enums"]["requirement_input_type"]
          is_active: boolean
          is_required: boolean
          requirement_code: string
          requirement_text: string
        }
        Insert: {
          category_id: string
          created_at?: string
          display_order: number
          help_text?: string | null
          id?: string
          input_type: Database["public"]["Enums"]["requirement_input_type"]
          is_active?: boolean
          is_required?: boolean
          requirement_code: string
          requirement_text: string
        }
        Update: {
          category_id?: string
          created_at?: string
          display_order?: number
          help_text?: string | null
          id?: string
          input_type?: Database["public"]["Enums"]["requirement_input_type"]
          is_active?: boolean
          is_required?: boolean
          requirement_code?: string
          requirement_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "due_diligence_requirements_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "due_diligence_categories"
            referencedColumns: ["id"]
          },
        ]
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
      intake_access_tokens: {
        Row: {
          client_intake_id: string
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          token_hash: string
          user_agent: string | null
        }
        Insert: {
          client_intake_id: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          token_hash: string
          user_agent?: string | null
        }
        Update: {
          client_intake_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          token_hash?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intake_access_tokens_client_intake_id_fkey"
            columns: ["client_intake_id"]
            isOneToOne: false
            referencedRelation: "client_intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_activity_log: {
        Row: {
          activity_type: string
          actor_email: string | null
          actor_type: Database["public"]["Enums"]["activity_actor_type"]
          client_intake_id: string
          created_at: string
          description: string | null
          id: string
        }
        Insert: {
          activity_type: string
          actor_email?: string | null
          actor_type: Database["public"]["Enums"]["activity_actor_type"]
          client_intake_id: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Update: {
          activity_type?: string
          actor_email?: string | null
          actor_type?: Database["public"]["Enums"]["activity_actor_type"]
          client_intake_id?: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_activity_log_client_intake_id_fkey"
            columns: ["client_intake_id"]
            isOneToOne: false
            referencedRelation: "client_intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_specialists: {
        Row: {
          category_id: string
          client_intake_id: string
          created_at: string
          email: string
          id: string
          name: string
          role: string | null
          updated_at: string
        }
        Insert: {
          category_id: string
          client_intake_id: string
          created_at?: string
          email: string
          id?: string
          name: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          client_intake_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string | null
          updated_at?: string
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
      generate_intake_code: { Args: never; Returns: string }
      get_intake_category_detail: {
        Args: { p_category_code: string; p_intake_id: string; p_token: string }
        Returns: Json
      }
      get_intake_overview: {
        Args: { p_intake_id: string; p_token: string }
        Returns: Json
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
      register_intake_document: {
        Args: {
          p_file_name: string
          p_file_size: number
          p_file_type: string
          p_file_url: string
          p_intake_id: string
          p_replaces_document_id?: string
          p_requirement_id: string
          p_token: string
          p_upload_comment: string
          p_uploaded_by_email: string
        }
        Returns: string
      }
      seed_deal_from_intake: {
        Args: { p_deal_id: string; p_intake_id: string }
        Returns: Json
      }
      seed_expert_tasks_for_category: {
        Args: { p_category_id: string; p_deal_id: string }
        Returns: undefined
      }
      submit_intake_category: {
        Args: { p_category_id: string; p_intake_id: string; p_token: string }
        Returns: boolean
      }
      submit_intake_response: {
        Args: {
          p_applicable_status: string
          p_comment: string
          p_intake_id: string
          p_requirement_id: string
          p_response_value: string
          p_token: string
          p_yes_no: boolean
        }
        Returns: string
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
      validate_intake_access_token: {
        Args: { p_intake_id: string; p_token: string }
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
      verify_intake_code: {
        Args: { p_code: string; p_ip?: string; p_user_agent?: string }
        Returns: {
          access_token: string
          intake_code: string
          intake_id: string
          message: string
          success: boolean
        }[]
      }
    }
    Enums: {
      activity_actor_type: "advisor" | "respondent" | "system" | "mia"
      advisor_comment_type:
        | "general"
        | "clarification_request"
        | "reupload_request"
        | "approval_note"
        | "risk_note"
      intake_category_status:
        | "not_started"
        | "in_progress"
        | "submitted"
        | "changes_requested"
        | "approved"
      intake_client_type: "seller" | "buyer" | "target"
      intake_document_status:
        | "missing"
        | "uploaded"
        | "changes_requested"
        | "approved"
        | "rejected"
      intake_status:
        | "draft"
        | "request_sent"
        | "awaiting_response"
        | "in_progress"
        | "submitted_for_review"
        | "changes_requested"
        | "approved"
        | "converted_to_deal"
      requirement_input_type:
        | "written_response"
        | "yes_no"
        | "applicable_na"
        | "document_upload"
        | "document_upload_with_comment"
      requirement_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "submitted"
        | "changes_requested"
        | "approved"
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
      activity_actor_type: ["advisor", "respondent", "system", "mia"],
      advisor_comment_type: [
        "general",
        "clarification_request",
        "reupload_request",
        "approval_note",
        "risk_note",
      ],
      intake_category_status: [
        "not_started",
        "in_progress",
        "submitted",
        "changes_requested",
        "approved",
      ],
      intake_client_type: ["seller", "buyer", "target"],
      intake_document_status: [
        "missing",
        "uploaded",
        "changes_requested",
        "approved",
        "rejected",
      ],
      intake_status: [
        "draft",
        "request_sent",
        "awaiting_response",
        "in_progress",
        "submitted_for_review",
        "changes_requested",
        "approved",
        "converted_to_deal",
      ],
      requirement_input_type: [
        "written_response",
        "yes_no",
        "applicable_na",
        "document_upload",
        "document_upload_with_comment",
      ],
      requirement_status: [
        "not_started",
        "in_progress",
        "completed",
        "submitted",
        "changes_requested",
        "approved",
      ],
    },
  },
} as const
