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
      batch_imports: {
        Row: {
          batch_number: number
          created_at: string | null
          end_index: number
          error_message: string | null
          id: string
          import_progress_id: string | null
          start_index: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          batch_number: number
          created_at?: string | null
          end_index: number
          error_message?: string | null
          id?: string
          import_progress_id?: string | null
          start_index: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          batch_number?: number
          created_at?: string | null
          end_index?: number
          error_message?: string | null
          id?: string
          import_progress_id?: string | null
          start_index?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_imports_import_progress_id_fkey"
            columns: ["import_progress_id"]
            isOneToOne: false
            referencedRelation: "import_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      import_file_mappings: {
        Row: {
          created_at: string | null
          file_field_name: string
          id: string
          import_file_id: string | null
          user_id: string | null
          woocommerce_field: string
        }
        Insert: {
          created_at?: string | null
          file_field_name: string
          id?: string
          import_file_id?: string | null
          user_id?: string | null
          woocommerce_field: string
        }
        Update: {
          created_at?: string | null
          file_field_name?: string
          id?: string
          import_file_id?: string | null
          user_id?: string | null
          woocommerce_field?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_file_mappings_import_file_id_fkey"
            columns: ["import_file_id"]
            isOneToOne: false
            referencedRelation: "import_files"
            referencedColumns: ["id"]
          },
        ]
      }
      import_files: {
        Row: {
          content: string
          created_at: string | null
          file_type: string
          filename: string
          id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          file_type: string
          filename: string
          id?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          file_type?: string
          filename?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      import_progress: {
        Row: {
          created_at: string | null
          current_batch: number | null
          delay_time: number | null
          error_message: string | null
          file_id: string | null
          id: string
          processed_products: number | null
          status: string | null
          store_id: string | null
          total_products: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_batch?: number | null
          delay_time?: number | null
          error_message?: string | null
          file_id?: string | null
          id?: string
          processed_products?: number | null
          status?: string | null
          store_id?: string | null
          total_products?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_batch?: number | null
          delay_time?: number | null
          error_message?: string | null
          file_id?: string | null
          id?: string
          processed_products?: number | null
          status?: string | null
          store_id?: string | null
          total_products?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_progress_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "import_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_progress_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "woocommerce_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      proceed_products: {
        Row: {
          categories: Json | null
          created_at: string | null
          description: string | null
          downloadable: boolean | null
          id: string
          images: Json | null
          import_file_id: string | null
          name: string
          regular_price: number | null
          sale_price: number | null
          short_description: string | null
          sku: string | null
          status: string | null
          stock_quantity: number | null
          tags: Json | null
          type: string | null
          updated_at: string | null
          user_id: string
          virtual: boolean | null
        }
        Insert: {
          categories?: Json | null
          created_at?: string | null
          description?: string | null
          downloadable?: boolean | null
          id?: string
          images?: Json | null
          import_file_id?: string | null
          name: string
          regular_price?: number | null
          sale_price?: number | null
          short_description?: string | null
          sku?: string | null
          status?: string | null
          stock_quantity?: number | null
          tags?: Json | null
          type?: string | null
          updated_at?: string | null
          user_id: string
          virtual?: boolean | null
        }
        Update: {
          categories?: Json | null
          created_at?: string | null
          description?: string | null
          downloadable?: boolean | null
          id?: string
          images?: Json | null
          import_file_id?: string | null
          name?: string
          regular_price?: number | null
          sale_price?: number | null
          short_description?: string | null
          sku?: string | null
          status?: string | null
          stock_quantity?: number | null
          tags?: Json | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
          virtual?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "proceed_products_import_file_id_fkey"
            columns: ["import_file_id"]
            isOneToOne: false
            referencedRelation: "import_files"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      woocommerce_product_fields: {
        Row: {
          created_at: string | null
          field_name: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          field_name: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          field_name?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      woocommerce_settings: {
        Row: {
          consumer_key: string
          consumer_secret: string
          created_at: string | null
          id: string
          is_connected: boolean | null
          last_connection_check: string | null
          store_name: string
          updated_at: string | null
          user_id: string | null
          woocommerce_url: string
        }
        Insert: {
          consumer_key: string
          consumer_secret: string
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          last_connection_check?: string | null
          store_name: string
          updated_at?: string | null
          user_id?: string | null
          woocommerce_url: string
        }
        Update: {
          consumer_key?: string
          consumer_secret?: string
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          last_connection_check?: string | null
          store_name?: string
          updated_at?: string | null
          user_id?: string | null
          woocommerce_url?: string
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
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
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
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
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
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
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
