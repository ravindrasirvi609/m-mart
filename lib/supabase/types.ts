export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string;
          email: string;
        };
        Insert: {
          created_at?: string;
          email: string;
        };
        Update: {
          created_at?: string;
          email?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          price: number;
          product_id: string;
          quantity: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          price: number;
          product_id: string;
          quantity: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          price?: number;
          product_id?: string;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          created_at: string;
          delivery_address: Json;
          delivery_charge: number;
          id: string;
          order_status:
            | "pending"
            | "paid"
            | "preparing"
            | "out_for_delivery"
            | "delivered"
            | "cancelled";
          payment_screenshot_url: string | null;
          payment_status: "pending_verification" | "paid" | "rejected";
          total_amount: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          delivery_address: Json;
          delivery_charge: number;
          id?: string;
          order_status?:
            | "pending"
            | "paid"
            | "preparing"
            | "out_for_delivery"
            | "delivered"
            | "cancelled";
          payment_screenshot_url?: string | null;
          payment_status?: "pending_verification" | "paid" | "rejected";
          total_amount: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          delivery_address?: Json;
          delivery_charge?: number;
          id?: string;
          order_status?:
            | "pending"
            | "paid"
            | "preparing"
            | "out_for_delivery"
            | "delivered"
            | "cancelled";
          payment_screenshot_url?: string | null;
          payment_status?: "pending_verification" | "paid" | "rejected";
          total_amount?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category: string;
          created_at: string;
          description: string;
          discount_price: number | null;
          id: string;
          image_url: string;
          is_active: boolean;
          name: string;
          price: number;
          stock: number;
        };
        Insert: {
          category: string;
          created_at?: string;
          description: string;
          discount_price?: number | null;
          id?: string;
          image_url: string;
          is_active?: boolean;
          name: string;
          price: number;
          stock?: number;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string;
          discount_price?: number | null;
          id?: string;
          image_url?: string;
          is_active?: boolean;
          name?: string;
          price?: number;
          stock?: number;
        };
        Relationships: [];
      };
      users: {
        Row: {
          address: string | null;
          created_at: string;
          email: string;
          id: string;
          name: string | null;
          phone: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          email: string;
          id: string;
          name?: string | null;
          phone?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          name?: string | null;
          phone?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      place_order_with_items: {
        Args: {
          p_user_id: string;
          p_payment_screenshot_url: string;
          p_delivery_address: Json;
          p_items: Json;
        };
        Returns: {
          order_id: string;
          total_amount: number;
          delivery_charge: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
