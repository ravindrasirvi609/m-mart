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
      banners: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          image_url: string;
          link_url: string | null;
          bg_color: string | null;
          location_area: string | null;
          target_lat: number | null;
          target_lng: number | null;
          target_radius_km: number | null;
          starts_at: string;
          ends_at: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          subtitle?: string | null;
          image_url: string;
          link_url?: string | null;
          bg_color?: string | null;
          location_area?: string | null;
          target_lat?: number | null;
          target_lng?: number | null;
          target_radius_km?: number | null;
          starts_at?: string;
          ends_at?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          subtitle?: string | null;
          image_url?: string;
          link_url?: string | null;
          bg_color?: string | null;
          location_area?: string | null;
          target_lat?: number | null;
          target_lng?: number | null;
          target_radius_km?: number | null;
          starts_at?: string;
          ends_at?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      campaign_products: {
        Row: {
          campaign_id: string;
          product_id: string;
          sort_order: number;
        };
        Insert: {
          campaign_id: string;
          product_id: string;
          sort_order?: number;
        };
        Update: {
          campaign_id?: string;
          product_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_products_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      campaigns: {
        Row: {
          id: string;
          name: string;
          slug: string;
          campaign_type:
            | "festival"
            | "seasonal"
            | "flash_sale"
            | "weekly"
            | "custom";
          hero_title: string;
          hero_subtitle: string | null;
          hero_image_url: string | null;
          hero_bg_gradient: string | null;
          badge_text: string | null;
          discount_label: string | null;
          starts_at: string;
          ends_at: string;
          target_lat: number | null;
          target_lng: number | null;
          target_radius_km: number | null;
          is_active: boolean;
          priority: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          campaign_type:
            | "festival"
            | "seasonal"
            | "flash_sale"
            | "weekly"
            | "custom";
          hero_title: string;
          hero_subtitle?: string | null;
          hero_image_url?: string | null;
          hero_bg_gradient?: string | null;
          badge_text?: string | null;
          discount_label?: string | null;
          starts_at: string;
          ends_at: string;
          target_lat?: number | null;
          target_lng?: number | null;
          target_radius_km?: number | null;
          is_active?: boolean;
          priority?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          campaign_type?:
            | "festival"
            | "seasonal"
            | "flash_sale"
            | "weekly"
            | "custom";
          hero_title?: string;
          hero_subtitle?: string | null;
          hero_image_url?: string | null;
          hero_bg_gradient?: string | null;
          badge_text?: string | null;
          discount_label?: string | null;
          starts_at?: string;
          ends_at?: string;
          target_lat?: number | null;
          target_lng?: number | null;
          target_radius_km?: number | null;
          is_active?: boolean;
          priority?: number;
          created_at?: string;
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
      delivery_agents: {
        Row: {
          id: string;
          name: string;
          phone: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      delivery_tracking: {
        Row: {
          id: string;
          order_id: string;
          agent_id: string | null;
          latitude: number;
          longitude: number;
          heading: number | null;
          speed: number | null;
          estimated_arrival: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          agent_id?: string | null;
          latitude: number;
          longitude: number;
          heading?: number | null;
          speed?: number | null;
          estimated_arrival?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          agent_id?: string | null;
          latitude?: number;
          longitude?: number;
          heading?: number | null;
          speed?: number | null;
          estimated_arrival?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_tracking_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_tracking_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "delivery_agents";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          order_status: string;
          payment_status: string;
          changed_by: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          order_status: string;
          payment_status: string;
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          order_status?: string;
          payment_status?: string;
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      collection_products: {
        Row: {
          collection_id: string;
          product_id: string;
          sort_order: number;
        };
        Insert: {
          collection_id: string;
          product_id: string;
          sort_order?: number;
        };
        Update: {
          collection_id?: string;
          product_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collection_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      collections: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon_name: string | null;
          bg_color: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon_name?: string | null;
          bg_color?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          icon_name?: string | null;
          bg_color?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          is_read: boolean;
          kind: string;
          message: string;
          order_id: string | null;
          target_role: "admin" | "customer";
          title: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          kind: string;
          message: string;
          order_id?: string | null;
          target_role: "admin" | "customer";
          title: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          kind?: string;
          message?: string;
          order_id?: string | null;
          target_role?: "admin" | "customer";
          title?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
          delivery_area: string | null;
          delivery_distance_km: number | null;
          delivery_lat: number | null;
          delivery_lng: number | null;
          service_area_id: string | null;
          assigned_agent_id: string | null;
          delivered_at: string | null;
          out_for_delivery_at: string | null;
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
          delivery_area?: string | null;
          delivery_distance_km?: number | null;
          delivery_lat?: number | null;
          delivery_lng?: number | null;
          service_area_id?: string | null;
          assigned_agent_id?: string | null;
          delivered_at?: string | null;
          out_for_delivery_at?: string | null;
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
          delivery_area?: string | null;
          delivery_distance_km?: number | null;
          delivery_lat?: number | null;
          delivery_lng?: number | null;
          service_area_id?: string | null;
          assigned_agent_id?: string | null;
          delivered_at?: string | null;
          out_for_delivery_at?: string | null;
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
          image_urls: string[];
          net_qty: string | null;
          product_highlights: Record<string, string> | null;
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
          image_urls?: string[];
          net_qty?: string | null;
          product_highlights?: Record<string, string> | null;
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
          image_urls?: string[];
          net_qty?: string | null;
          product_highlights?: Record<string, string> | null;
          is_active?: boolean;
          name?: string;
          price?: number;
          stock?: number;
        };
        Relationships: [];
      };
      product_tags: {
        Row: {
          id: string;
          product_id: string;
          tag: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          tag: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          tag?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      service_areas: {
        Row: {
          id: string;
          area_name: string;
          city: string;
          pincode: string | null;
          latitude: number | null;
          longitude: number | null;
          radius_km: number | null;
          delivery_fee: number | null;
          min_order_free_delivery: number | null;
          is_active: boolean;
          delivery_eta_minutes: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          area_name: string;
          city?: string;
          pincode?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          radius_km?: number | null;
          delivery_fee?: number | null;
          min_order_free_delivery?: number | null;
          is_active?: boolean;
          delivery_eta_minutes?: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          area_name?: string;
          city?: string;
          pincode?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          radius_km?: number | null;
          delivery_fee?: number | null;
          min_order_free_delivery?: number | null;
          is_active?: boolean;
          delivery_eta_minutes?: number;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      user_locations: {
        Row: {
          user_id: string;
          area: string;
          city: string;
          pincode: string | null;
          latitude: number | null;
          longitude: number | null;
          location_source: string | null;
          accuracy_metres: number | null;
          last_latitude: number | null;
          last_longitude: number | null;
          last_location_updated_at: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          area: string;
          city?: string;
          pincode?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          location_source?: string | null;
          accuracy_metres?: number | null;
          last_latitude?: number | null;
          last_longitude?: number | null;
          last_location_updated_at?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          area?: string;
          city?: string;
          pincode?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          location_source?: string | null;
          accuracy_metres?: number | null;
          last_latitude?: number | null;
          last_longitude?: number | null;
          last_location_updated_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_locations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
      get_active_deals: {
        Args: {
          result_limit?: number;
        };
        Returns: Database["public"]["Tables"]["products"]["Row"][];
      };
      get_best_sellers: {
        Args: {
          days_back?: number;
          result_limit?: number;
        };
        Returns: Database["public"]["Tables"]["products"]["Row"][];
      };
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
          p_lat?: number;
          p_lng?: number;
        };
        Returns: {
          order_id: string;
          total_amount: number;
          delivery_charge: number;
        }[];
      };
      check_delivery_coverage: {
        Args: {
          p_lat: number;
          p_lng: number;
        };
        Returns: {
          covered: boolean;
          service_area_id: string | null;
          area_name: string | null;
          delivery_fee: number;
          min_order_free_delivery: number;
          delivery_eta_minutes: number | null;
          distance_km: number;
        }[];
      };
      find_nearest_service_area: {
        Args: {
          p_lat: number;
          p_lng: number;
          p_max_distance_km?: number;
        };
        Returns: {
          id: string;
          area_name: string;
          city: string;
          pincode: string;
          delivery_eta_minutes: number | null;
          delivery_fee: number | null;
          min_order_free_delivery: number | null;
          distance_km: number;
        }[];
      };
      get_geo_targeted_banners: {
        Args: {
          p_lat: number;
          p_lng: number;
        };
        Returns: Database["public"]["Tables"]["banners"]["Row"][];
      };
      get_geo_targeted_campaign: {
        Args: {
          p_lat: number;
          p_lng: number;
          p_slug: string;
        };
        Returns: Database["public"]["Tables"]["campaigns"]["Row"][];
      };
      update_delivery_location: {
        Args: {
          p_order_id: string;
          p_lat: number;
          p_lng: number;
          p_heading?: number;
          p_speed?: number;
          p_eta_minutes?: number;
        };
        Returns: boolean;
      };
      get_order_tracking: {
        Args: {
          p_order_id: string;
        };
        Returns: {
          order_id: string;
          order_status: string;
          payment_status: string;
          delivery_area: string | null;
          store_lat: number;
          store_lng: number;
          customer_lat: number | null;
          customer_lng: number | null;
          driver_lat: number | null;
          driver_lng: number | null;
          driver_heading: number | null;
          driver_speed: number | null;
          estimated_arrival: string | null;
          agent_name: string | null;
          agent_phone: string | null;
          assigned_at: string | null;
          out_for_delivery_at: string | null;
          delivered_at: string | null;
          tracking_updated_at: string | null;
        }[];
      };
      get_order_timeline: {
        Args: {
          p_order_id: string;
        };
        Returns: {
          id: string;
          order_status: string;
          payment_status: string;
          changed_by: string | null;
          note: string | null;
          created_at: string;
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
