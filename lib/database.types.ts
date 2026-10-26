// Gerado a partir do banco do Supabase (não editar à mão).
// Para atualizar após uma migration: gerar de novo pelo conector do Supabase ou
// `supabase gen types typescript --project-id ghdytnynplyhugkpmhoy > lib/database.types.ts`

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          key: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_url: string | null
          position: number | null
          profile_id: string
          size: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          position?: number | null
          profile_id: string
          size?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          position?: number | null
          profile_id?: string
          size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banners_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clicks: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          profile_id: string | null
          visitor_hash: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          profile_id?: string | null
          visitor_hash?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          profile_id?: string | null
          visitor_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clicks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_domains: {
        Row: {
          created_at: string | null
          domain: string
          error_message: string | null
          id: string
          last_checked_at: string | null
          netlify_added: boolean
          profile_id: string
          status: string
          verification_token: string
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          error_message?: string | null
          id?: string
          last_checked_at?: string | null
          netlify_added?: boolean
          profile_id: string
          status?: string
          verification_token?: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          error_message?: string | null
          id?: string
          last_checked_at?: string | null
          netlify_added?: boolean
          profile_id?: string
          status?: string
          verification_token?: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_domains_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      help_articles: {
        Row: {
          body: string | null
          category_id: string
          created_at: string | null
          id: string
          published: boolean | null
          slug: string
          sort_order: number | null
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          category_id: string
          created_at?: string | null
          id?: string
          published?: boolean | null
          slug: string
          sort_order?: number | null
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          category_id?: string
          created_at?: string | null
          id?: string
          published?: boolean | null
          slug?: string
          sort_order?: number | null
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "help_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "help_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      help_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          published: boolean | null
          slug: string
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          published?: boolean | null
          slug: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          published?: boolean | null
          slug?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      landing_carousel_settings: {
        Row: {
          auto_advance_ms: number
          drag_enabled: boolean
          id: number
          inactive_opacity: number
          pause_on_hover: boolean
          scale_active: number
          scale_inactive: number
          transition_ms: number
          translate_percent: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          auto_advance_ms?: number
          drag_enabled?: boolean
          id?: number
          inactive_opacity?: number
          pause_on_hover?: boolean
          scale_active?: number
          scale_inactive?: number
          transition_ms?: number
          translate_percent?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          auto_advance_ms?: number
          drag_enabled?: boolean
          id?: number
          inactive_opacity?: number
          pause_on_hover?: boolean
          scale_active?: number
          scale_inactive?: number
          transition_ms?: number
          translate_percent?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      landing_niches: {
        Row: {
          benefits: string[]
          demo: Json
          description: string
          headline: string
          id: string
          is_active: boolean
          key: string
          label: string
          position: number
          theme_key: string
          updated_at: string
        }
        Insert: {
          benefits?: string[]
          demo?: Json
          description?: string
          headline?: string
          id?: string
          is_active?: boolean
          key: string
          label: string
          position?: number
          theme_key: string
          updated_at?: string
        }
        Update: {
          benefits?: string[]
          demo?: Json
          description?: string
          headline?: string
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          position?: number
          theme_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          email: string
          id: string
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          username?: string | null
        }
        Relationships: []
      }
      links: {
        Row: {
          clicks: number | null
          created_at: string | null
          ends_at: string | null
          icon: string | null
          icon_fetched_at: string | null
          icon_source: string | null
          id: string
          is_active: boolean | null
          position: number | null
          profile_id: string
          show_icon: boolean | null
          starts_at: string | null
          title: string | null
          url: string | null
        }
        Insert: {
          clicks?: number | null
          created_at?: string | null
          ends_at?: string | null
          icon?: string | null
          icon_fetched_at?: string | null
          icon_source?: string | null
          id?: string
          is_active?: boolean | null
          position?: number | null
          profile_id: string
          show_icon?: boolean | null
          starts_at?: string | null
          title?: string | null
          url?: string | null
        }
        Update: {
          clicks?: number | null
          created_at?: string | null
          ends_at?: string | null
          icon?: string | null
          icon_fetched_at?: string | null
          icon_source?: string | null
          id?: string
          is_active?: boolean | null
          position?: number | null
          profile_id?: string
          show_icon?: boolean | null
          starts_at?: string | null
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          created_by: string
          expires_at: string
          id: string
          page_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          page_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          page_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_invites_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_leads: {
        Row: {
          consent_at: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          profile_id: string
          visitor_hash: string
        }
        Insert: {
          consent_at?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          profile_id: string
          visitor_hash: string
        }
        Update: {
          consent_at?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          profile_id?: string
          visitor_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_leads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_members: {
        Row: {
          created_at: string
          id: string
          page_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_members_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          country: string | null
          created_at: string
          device: string
          id: string
          profile_id: string
          source: string
          visitor_hash: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          device?: string
          id?: string
          profile_id: string
          source?: string
          visitor_hash: string
        }
        Update: {
          country?: string | null
          created_at?: string
          device?: string
          id?: string
          profile_id?: string
          source?: string
          visitor_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          mp_status_detail: string | null
          paid_at: string | null
          period: string
          plan_granted_until: string | null
          plan_slug: string
          profile_id: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          mp_status_detail?: string | null
          paid_at?: string | null
          period?: string
          plan_granted_until?: string | null
          plan_slug: string
          profile_id: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          mp_status_detail?: string | null
          paid_at?: string | null
          period?: string
          plan_granted_until?: string | null
          plan_slug?: string
          profile_id?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          admin_note: string | null
          amount_cents: number
          created_at: string | null
          id: string
          pix_full_name: string
          pix_key: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount_cents: number
          created_at?: string | null
          id?: string
          pix_full_name?: string
          pix_key?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount_cents?: number
          created_at?: string | null
          id?: string
          pix_full_name?: string
          pix_key?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          billing_period: string | null
          button_label: string | null
          button_url: string | null
          created_at: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          limits: Json | null
          name: string
          price_annual_cents: number | null
          price_cents: number | null
          slug: string | null
        }
        Insert: {
          billing_period?: string | null
          button_label?: string | null
          button_url?: string | null
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          name: string
          price_annual_cents?: number | null
          price_cents?: number | null
          slug?: string | null
        }
        Update: {
          billing_period?: string | null
          button_label?: string | null
          button_url?: string | null
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          name?: string
          price_annual_cents?: number | null
          price_cents?: number | null
          slug?: string | null
        }
        Relationships: []
      }
      profile_private: {
        Row: {
          commission_balance: number
          pix_full_name: string
          pix_key: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          commission_balance?: number
          pix_full_name?: string
          pix_key?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          commission_balance?: number
          pix_full_name?: string
          pix_key?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_private_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          monthly_report_enabled: boolean
          countdown_ends_at: string | null
          countdown_title: string | null
          avatar_size: number | null
          avatar_url: string | null
          bg_color: string | null
          bio: string | null
          border_width: number | null
          button_color: string | null
          created_at: string | null
          display_name: string | null
          ga_enabled: boolean
          ga_measurement_id: string | null
          hide_branding: boolean
          id: string
          is_pro: boolean | null
          meta_pixel_enabled: boolean
          meta_pixel_id: string | null
          owner_id: string | null
          plan: string | null
          plan_expires_at: string | null
          plan_started_at: string | null
          referral_code: string | null
          referred_by: string | null
          role: string | null
          section_order: string[]
          seo_description: string | null
          seo_image_url: string | null
          seo_title: string | null
          shadow_offset: number | null
          suspended_at: string | null
          text_color: string | null
          theme: string | null
          theme_color: string | null
          theme_settings: Json | null
          updated_at: string | null
          username: string
        }
        Insert: {
          monthly_report_enabled?: boolean
          countdown_ends_at?: string | null
          countdown_title?: string | null
          avatar_size?: number | null
          avatar_url?: string | null
          bg_color?: string | null
          bio?: string | null
          border_width?: number | null
          button_color?: string | null
          created_at?: string | null
          display_name?: string | null
          ga_enabled?: boolean
          ga_measurement_id?: string | null
          hide_branding?: boolean
          id: string
          is_pro?: boolean | null
          meta_pixel_enabled?: boolean
          meta_pixel_id?: string | null
          owner_id?: string | null
          plan?: string | null
          plan_expires_at?: string | null
          plan_started_at?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: string | null
          section_order?: string[]
          seo_description?: string | null
          seo_image_url?: string | null
          seo_title?: string | null
          shadow_offset?: number | null
          suspended_at?: string | null
          text_color?: string | null
          theme?: string | null
          theme_color?: string | null
          theme_settings?: Json | null
          updated_at?: string | null
          username: string
        }
        Update: {
          monthly_report_enabled?: boolean
          countdown_ends_at?: string | null
          countdown_title?: string | null
          avatar_size?: number | null
          avatar_url?: string | null
          bg_color?: string | null
          bio?: string | null
          border_width?: number | null
          button_color?: string | null
          created_at?: string | null
          display_name?: string | null
          ga_enabled?: boolean
          ga_measurement_id?: string | null
          hide_branding?: boolean
          id?: string
          is_pro?: boolean | null
          meta_pixel_enabled?: boolean
          meta_pixel_id?: string | null
          owner_id?: string | null
          plan?: string | null
          plan_expires_at?: string | null
          plan_started_at?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: string | null
          section_order?: string[]
          seo_description?: string | null
          seo_image_url?: string | null
          seo_title?: string | null
          shadow_offset?: number | null
          suspended_at?: string | null
          text_color?: string | null
          theme?: string | null
          theme_color?: string | null
          theme_settings?: Json | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          commission_status: string | null
          commission_value: number | null
          created_at: string | null
          id: string
          plan_type: string | null
          referred_id: string
          referrer_id: string
          reward_granted: boolean | null
          status: string | null
        }
        Insert: {
          commission_status?: string | null
          commission_value?: number | null
          created_at?: string | null
          id?: string
          plan_type?: string | null
          referred_id: string
          referrer_id: string
          reward_granted?: boolean | null
          status?: string | null
        }
        Update: {
          commission_status?: string | null
          commission_value?: number | null
          created_at?: string | null
          id?: string
          plan_type?: string | null
          referred_id?: string
          referrer_id?: string
          reward_granted?: boolean | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_links: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          platform: string | null
          position: number | null
          profile_id: string
          url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string | null
          position?: number | null
          profile_id: string
          url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string | null
          position?: number | null
          profile_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string
          plan_id: string | null
          profile_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan_id?: string | null
          profile_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan_id?: string | null
          profile_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_presets: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json
          theme_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json
          theme_key?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json
          theme_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      theme_showcase_presets: {
        Row: {
          catalog_banners: Json | null
          catalog_links: Json | null
          catalog_order: number
          catalog_profile: Json | null
          catalog_socials: Json | null
          catalog_theme_core: Json | null
          catalog_theme_settings: Json | null
          catalog_videos: Json | null
          landing_banners: Json | null
          landing_links: Json | null
          landing_order: number | null
          landing_profile: Json | null
          landing_socials: Json | null
          landing_tagline: string | null
          landing_theme_core: Json | null
          landing_theme_settings: Json | null
          landing_videos: Json | null
          show_in_catalog: boolean | null
          show_in_landing_carousel: boolean | null
          theme_key: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          catalog_banners?: Json | null
          catalog_links?: Json | null
          catalog_order?: number
          catalog_profile?: Json | null
          catalog_socials?: Json | null
          catalog_theme_core?: Json | null
          catalog_theme_settings?: Json | null
          catalog_videos?: Json | null
          landing_banners?: Json | null
          landing_links?: Json | null
          landing_order?: number | null
          landing_profile?: Json | null
          landing_socials?: Json | null
          landing_tagline?: string | null
          landing_theme_core?: Json | null
          landing_theme_settings?: Json | null
          landing_videos?: Json | null
          show_in_catalog?: boolean | null
          show_in_landing_carousel?: boolean | null
          theme_key: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          catalog_banners?: Json | null
          catalog_links?: Json | null
          catalog_order?: number
          catalog_profile?: Json | null
          catalog_socials?: Json | null
          catalog_theme_core?: Json | null
          catalog_theme_settings?: Json | null
          catalog_videos?: Json | null
          landing_banners?: Json | null
          landing_links?: Json | null
          landing_order?: number | null
          landing_profile?: Json | null
          landing_socials?: Json | null
          landing_tagline?: string | null
          landing_theme_core?: Json | null
          landing_theme_settings?: Json | null
          landing_videos?: Json | null
          show_in_catalog?: boolean | null
          show_in_landing_carousel?: boolean | null
          theme_key?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          aspect: string | null
          created_at: string | null
          embed_url: string | null
          id: string
          is_active: boolean | null
          platform: string | null
          position: number | null
          profile_id: string
          provider_id: string | null
          thumbnail: string | null
          title: string | null
          url: string | null
        }
        Insert: {
          aspect?: string | null
          created_at?: string | null
          embed_url?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string | null
          position?: number | null
          profile_id: string
          provider_id?: string | null
          thumbnail?: string | null
          title?: string | null
          url?: string | null
        }
        Update: {
          aspect?: string | null
          created_at?: string | null
          embed_url?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string | null
          position?: number | null
          profile_id?: string
          provider_id?: string | null
          thumbnail?: string | null
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_profile_id_fkey"
            columns: ["profile_id"]
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
      admin_dashboard_stats: { Args: never; Returns: Json }
      admin_resolve_payout: {
        Args: { p_action: string; p_note?: string; p_payout_id: string }
        Returns: {
          admin_note: string | null
          amount_cents: number
          created_at: string | null
          id: string
          pix_full_name: string
          pix_key: string
          status: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "payout_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      effective_plan: { Args: { p_profile_id: string }; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      grant_paid_plan: { Args: { p_payment_id: string }; Returns: string }
      can_manage_page: { Args: { p_profile_id: string }; Returns: boolean }
      accept_page_invite: { Args: { p_token: string }; Returns: string }
      create_page_invite: { Args: { p_page_id: string }; Returns: string }
      get_page_invite: { Args: { p_token: string }; Returns: Json }
      is_page_owner: { Args: { p_profile_id: string }; Returns: boolean }
      create_page: { Args: { p_display_name: string; p_username: string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_pro_only_theme: { Args: { p_theme: string }; Returns: boolean }
      is_reserved_username: { Args: { p_username: string }; Returns: boolean }
      is_suspended: { Args: { p_profile_id: string }; Returns: boolean }
      lead_usage: { Args: { p_profile_id?: string }; Returns: Json }
      lookup_domain: {
        Args: { p_domain: string }
        Returns: {
          profile_id: string
          username: string
        }[]
      }
      plan_limit: {
        Args: { p_key: string; p_profile_id: string }
        Returns: Json
      }
      profile_analytics: { Args: { p_days?: number; p_profile_id?: string }; Returns: Json }
      request_payout: {
        Args: never
        Returns: {
          admin_note: string | null
          amount_cents: number
          created_at: string | null
          id: string
          pix_full_name: string
          pix_key: string
          status: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "payout_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_lead: {
        Args: {
          p_consent: boolean
          p_email: string
          p_name: string
          p_phone: string
          p_profile_id: string
        }
        Returns: boolean
      }
      theme_usage_counts: {
        Args: never
        Returns: {
          count: number
          theme: string
        }[]
      }
      track_click: {
        Args: {
          p_entity_id?: string
          p_entity_type: string
          p_profile_id: string
        }
        Returns: boolean
      }
      track_view: {
        Args: { p_device?: string; p_profile_id: string; p_source?: string }
        Returns: boolean
      }
      user_detail_counts: {
        Args: { p_profile_id: string }
        Returns: {
          banners_count: number
          links_count: number
          socials_count: number
          videos_count: number
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
