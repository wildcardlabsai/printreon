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
      admin_activity_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_reports: {
        Row: {
          created_at: string
          creator_id: string | null
          file_id: string | null
          id: string
          reason: string
          reported_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          creator_id?: string | null
          file_id?: string | null
          id?: string
          reason: string
          reported_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          creator_id?: string | null
          file_id?: string | null
          id?: string
          reason?: string
          reported_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_reports_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_reports_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "creator_files"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      beta_preregistrations: {
        Row: {
          accepted_at: string | null
          audience_size: string | null
          biggest_frustration: string | null
          created_at: string
          creator_name: string | null
          current_platform: string | null
          email: string
          founder_pricing_eligible: boolean
          full_name: string | null
          id: string
          interested_in_commercial_licensing: boolean
          invite_code: string | null
          invited_at: string | null
          notes: string | null
          reason_for_joining: string | null
          referral_code: string | null
          referral_count: number
          referred_by: string | null
          sells_physical_prints: boolean
          sells_stls: boolean
          social_url: string | null
          source: string | null
          status: string
          tags: Json
          updated_at: string
          website_url: string | null
        }
        Insert: {
          accepted_at?: string | null
          audience_size?: string | null
          biggest_frustration?: string | null
          created_at?: string
          creator_name?: string | null
          current_platform?: string | null
          email: string
          founder_pricing_eligible?: boolean
          full_name?: string | null
          id?: string
          interested_in_commercial_licensing?: boolean
          invite_code?: string | null
          invited_at?: string | null
          notes?: string | null
          reason_for_joining?: string | null
          referral_code?: string | null
          referral_count?: number
          referred_by?: string | null
          sells_physical_prints?: boolean
          sells_stls?: boolean
          social_url?: string | null
          source?: string | null
          status?: string
          tags?: Json
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          accepted_at?: string | null
          audience_size?: string | null
          biggest_frustration?: string | null
          created_at?: string
          creator_name?: string | null
          current_platform?: string | null
          email?: string
          founder_pricing_eligible?: boolean
          full_name?: string | null
          id?: string
          interested_in_commercial_licensing?: boolean
          invite_code?: string | null
          invited_at?: string | null
          notes?: string | null
          reason_for_joining?: string | null
          referral_code?: string | null
          referral_count?: number
          referred_by?: string | null
          sells_physical_prints?: boolean
          sells_stls?: boolean
          social_url?: string | null
          source?: string | null
          status?: string
          tags?: Json
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_user_id: string | null
          body: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_user_id?: string | null
          body: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_user_id?: string | null
          body?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      broadcasts: {
        Row: {
          audience: string
          body: string
          created_at: string
          created_by: string | null
          id: string
          sent_at: string | null
          subject: string
        }
        Insert: {
          audience: string
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          sent_at?: string | null
          subject: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          sent_at?: string | null
          subject?: string
        }
        Relationships: []
      }
      bundle_files: {
        Row: {
          bundle_id: string
          file_id: string
          sort_order: number
        }
        Insert: {
          bundle_id: string
          file_id: string
          sort_order?: number
        }
        Update: {
          bundle_id?: string
          file_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "bundle_files_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_files_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "creator_files"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          cover_image_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_free: boolean
          is_published: boolean
          slug: string
          tier_required_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_free?: boolean
          is_published?: boolean
          slug: string
          tier_required_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_free?: boolean
          is_published?: boolean
          slug?: string
          tier_required_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundles_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundles_tier_required_id_fkey"
            columns: ["tier_required_id"]
            isOneToOne: false
            referencedRelation: "creator_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_files: {
        Row: {
          collection_id: string
          file_id: string
        }
        Insert: {
          collection_id: string
          file_id: string
        }
        Update: {
          collection_id?: string
          file_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_files_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "user_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_files_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "creator_files"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          created_at: string
          creator_id: string
          id: string
          is_hidden: boolean
          parent_id: string
          parent_type: string
          reply_to: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          creator_id: string
          id?: string
          is_hidden?: boolean
          parent_id: string
          parent_type: string
          reply_to?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          creator_id?: string
          id?: string
          is_hidden?: boolean
          parent_id?: string
          parent_type?: string
          reply_to?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_announcements: {
        Row: {
          audience: string
          content: string
          created_at: string
          creator_id: string
          id: string
          tier_id: string | null
          title: string
        }
        Insert: {
          audience?: string
          content: string
          created_at?: string
          creator_id: string
          id?: string
          tier_id?: string | null
          title: string
        }
        Update: {
          audience?: string
          content?: string
          created_at?: string
          creator_id?: string
          id?: string
          tier_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_announcements_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_announcements_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "creator_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_files: {
        Row: {
          bundle_id: string | null
          category: string | null
          created_at: string
          creator_id: string
          description: string | null
          download_count: number
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          infill_percent: number | null
          is_free: boolean
          is_published: boolean
          layer_height_mm: number | null
          material: string | null
          preview_images: Json
          print_time_minutes: number | null
          recommended_printer: string | null
          scheduled_at: string | null
          slug: string
          status: string
          supports_required: boolean | null
          tags: string[] | null
          tier_required_id: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          bundle_id?: string | null
          category?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          download_count?: number
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          infill_percent?: number | null
          is_free?: boolean
          is_published?: boolean
          layer_height_mm?: number | null
          material?: string | null
          preview_images?: Json
          print_time_minutes?: number | null
          recommended_printer?: string | null
          scheduled_at?: string | null
          slug: string
          status?: string
          supports_required?: boolean | null
          tags?: string[] | null
          tier_required_id?: string | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          bundle_id?: string | null
          category?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          download_count?: number
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          infill_percent?: number | null
          is_free?: boolean
          is_published?: boolean
          layer_height_mm?: number | null
          material?: string | null
          preview_images?: Json
          print_time_minutes?: number | null
          recommended_printer?: string | null
          scheduled_at?: string | null
          slug?: string
          status?: string
          supports_required?: boolean | null
          tags?: string[] | null
          tier_required_id?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "creator_files_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_files_tier_required_id_fkey"
            columns: ["tier_required_id"]
            isOneToOne: false
            referencedRelation: "creator_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_posts: {
        Row: {
          audience: string
          body: string
          cover_image_url: string | null
          created_at: string
          creator_id: string
          id: string
          published_at: string | null
          scheduled_at: string | null
          status: string
          tier_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          body: string
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          id?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          tier_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          body?: string
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          id?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          tier_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_posts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_posts_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "creator_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_profiles: {
        Row: {
          banner_image_url: string | null
          bio: string | null
          connected_account_id: string | null
          created_at: string
          cults_url: string | null
          display_name: string
          id: string
          instagram_url: string | null
          is_published: boolean
          is_verified: boolean
          makerworld_url: string | null
          payout_status: string | null
          platform_fee_percentage: number | null
          printables_url: string | null
          profile_image_url: string | null
          short_intro: string | null
          slug: string
          tiktok_url: string | null
          updated_at: string
          user_id: string
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          banner_image_url?: string | null
          bio?: string | null
          connected_account_id?: string | null
          created_at?: string
          cults_url?: string | null
          display_name: string
          id?: string
          instagram_url?: string | null
          is_published?: boolean
          is_verified?: boolean
          makerworld_url?: string | null
          payout_status?: string | null
          platform_fee_percentage?: number | null
          printables_url?: string | null
          profile_image_url?: string | null
          short_intro?: string | null
          slug: string
          tiktok_url?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          banner_image_url?: string | null
          bio?: string | null
          connected_account_id?: string | null
          created_at?: string
          cults_url?: string | null
          display_name?: string
          id?: string
          instagram_url?: string | null
          is_published?: boolean
          is_verified?: boolean
          makerworld_url?: string | null
          payout_status?: string | null
          platform_fee_percentage?: number | null
          printables_url?: string | null
          profile_image_url?: string | null
          short_intro?: string | null
          slug?: string
          tiktok_url?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      creator_tiers: {
        Row: {
          benefits: Json
          created_at: string
          creator_id: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          sort_order: number
          stripe_price_id: string | null
        }
        Insert: {
          benefits?: Json
          created_at?: string
          creator_id: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price: number
          sort_order?: number
          stripe_price_id?: string | null
        }
        Update: {
          benefits?: Json
          created_at?: string
          creator_id?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sort_order?: number
          stripe_price_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_tiers_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          sender_user_id: string
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_user_id: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_user_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "dm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_threads: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          last_message_at: string
          member_user_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          last_message_at?: string
          member_user_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          last_message_at?: string
          member_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_threads_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      downloads: {
        Row: {
          creator_id: string
          downloaded_at: string
          file_id: string
          id: string
          user_id: string
        }
        Insert: {
          creator_id: string
          downloaded_at?: string
          file_id: string
          id?: string
          user_id: string
        }
        Update: {
          creator_id?: string
          downloaded_at?: string
          file_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "downloads_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downloads_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "creator_files"
            referencedColumns: ["id"]
          },
        ]
      }
      email_outbox: {
        Row: {
          created_at: string
          error: string | null
          html: string
          id: string
          sent_at: string | null
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          html: string
          id?: string
          sent_at?: string | null
          status?: string
          subject: string
          to_email: string
        }
        Update: {
          created_at?: string
          error?: string | null
          html?: string
          id?: string
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          audience: string
          description: string | null
          enabled: boolean
          key: string
          name: string | null
          updated_at: string
        }
        Insert: {
          audience?: string
          description?: string | null
          enabled?: boolean
          key: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          audience?: string
          description?: string | null
          enabled?: boolean
          key?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      featured_creators: {
        Row: {
          creator_id: string
          featured_at: string
          sort_order: number
        }
        Insert: {
          creator_id: string
          featured_at?: string
          sort_order?: number
        }
        Update: {
          creator_id?: string
          featured_at?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "featured_creators_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      file_versions: {
        Row: {
          changelog: string | null
          created_at: string
          file_id: string
          file_size: number | null
          file_url: string
          id: string
          version: number
        }
        Insert: {
          changelog?: string | null
          created_at?: string
          file_id: string
          file_size?: number | null
          file_url: string
          id?: string
          version: number
        }
        Update: {
          changelog?: string | null
          created_at?: string
          file_id?: string
          file_size?: number | null
          file_url?: string
          id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "file_versions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "creator_files"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_subscriptions: {
        Row: {
          buyer_user_id: string
          created_at: string
          creator_id: string
          id: string
          months: number
          recipient_email: string
          recipient_user_id: string | null
          redeem_code: string
          redeemed_at: string | null
          status: string
          tier_id: string
        }
        Insert: {
          buyer_user_id: string
          created_at?: string
          creator_id: string
          id?: string
          months?: number
          recipient_email: string
          recipient_user_id?: string | null
          redeem_code: string
          redeemed_at?: string | null
          status?: string
          tier_id: string
        }
        Update: {
          buyer_user_id?: string
          created_at?: string
          creator_id?: string
          id?: string
          months?: number
          recipient_email?: string
          recipient_user_id?: string | null
          redeem_code?: string
          redeemed_at?: string | null
          status?: string
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_subscriptions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "creator_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          email: string | null
          expires_at: string | null
          id: string
          max_uses: number
          preregistration_id: string | null
          status: string
          used_at: string | null
          uses: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number
          preregistration_id?: string | null
          status?: string
          used_at?: string | null
          uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number
          preregistration_id?: string | null
          status?: string
          used_at?: string | null
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_preregistration_id_fkey"
            columns: ["preregistration_id"]
            isOneToOne: false
            referencedRelation: "beta_preregistrations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_prefs: {
        Row: {
          email_dm: boolean
          email_new_file: boolean
          email_new_post: boolean
          email_weekly_digest: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          email_dm?: boolean
          email_new_file?: boolean
          email_new_post?: boolean
          email_weekly_digest?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          email_dm?: boolean
          email_new_file?: boolean
          email_new_post?: boolean
          email_weekly_digest?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_announcements: {
        Row: {
          audience: string
          body: string
          created_at: string
          created_by: string | null
          id: string
          published_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          published_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          published_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      print_log: {
        Row: {
          created_at: string
          creator_id: string
          file_id: string
          id: string
          is_public: boolean
          notes: string | null
          photo_url: string | null
          rating: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          file_id: string
          id?: string
          is_public?: boolean
          notes?: string | null
          photo_url?: string | null
          rating?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          file_id?: string
          id?: string
          is_public?: boolean
          notes?: string | null
          photo_url?: string | null
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_log_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_log_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "creator_files"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          creator_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          percent_off: number
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          creator_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          percent_off: number
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          creator_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          percent_off?: number
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          parent_id: string
          parent_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          parent_id: string
          parent_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          parent_id?: string
          parent_type?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          creator_id: string | null
          id: string
          referral_code: string
          referred_user_id: string | null
          referrer_user_id: string | null
          reward_type: string | null
          status: string
        }
        Insert: {
          created_at?: string
          creator_id?: string | null
          id?: string
          referral_code: string
          referred_user_id?: string | null
          referrer_user_id?: string | null
          reward_type?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          creator_id?: string | null
          id?: string
          referral_code?: string
          referred_user_id?: string | null
          referrer_user_id?: string | null
          reward_type?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          creator_id: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          creator_id: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          creator_id?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "creator_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          body: string
          category: string | null
          created_at: string
          email: string
          id: string
          priority: string
          status: string
          subject: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          body: string
          category?: string | null
          created_at?: string
          email: string
          id?: string
          priority?: string
          status?: string
          subject: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          body?: string
          category?: string | null
          created_at?: string
          email?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_collections: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          role_interest: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role_interest?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role_interest?: string | null
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          file_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "creator_files"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_beta_referral_code: { Args: never; Returns: string }
      get_beta_referral_stats: {
        Args: { _code: string }
        Returns: {
          founder_pricing_eligible: boolean
          referral_count: number
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "member" | "creator" | "admin"
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
      app_role: ["member", "creator", "admin"],
    },
  },
} as const
