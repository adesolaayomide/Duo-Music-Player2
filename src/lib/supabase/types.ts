import type { Track } from "@/types";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      playlists: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          cover_url: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          cover_url?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          cover_url?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      playlist_tracks: {
        Row: {
          id: string;
          playlist_id: string;
          track_ref: Track;
          position: number;
          added_at: string;
        };
        Insert: {
          id?: string;
          playlist_id: string;
          track_ref: Track;
          position?: number;
          added_at?: string;
        };
        Update: {
          id?: string;
          playlist_id?: string;
          track_ref?: Track;
          position?: number;
          added_at?: string;
        };
        Relationships: [];
      };
      liked_tracks: {
        Row: {
          id: string;
          user_id: string;
          track_id: string;
          track_ref: Track;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          track_id: string;
          track_ref: Track;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          track_id?: string;
          track_ref?: Track;
          created_at?: string;
        };
        Relationships: [];
      };
      recently_played: {
        Row: {
          id: string;
          user_id: string;
          track_id: string;
          track_ref: Track;
          played_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          track_id: string;
          track_ref: Track;
          played_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          track_id?: string;
          track_ref?: Track;
          played_at?: string;
        };
        Relationships: [];
      };
      connected_accounts: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          external_account_id: string;
          status: "connected" | "revoked" | "error";
          connected_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          external_account_id: string;
          status?: "connected" | "revoked" | "error";
          connected_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          external_account_id?: string;
          status?: "connected" | "revoked" | "error";
          connected_at?: string;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      import_transfers: {
        Row: {
          id: string;
          user_id: string;
          connected_account_id: string | null;
          provider_transfer_id: string | null;
          status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
          source_playlist_name: string;
          total_items: number;
          imported_items: number;
          failed_items: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          connected_account_id?: string | null;
          provider_transfer_id?: string | null;
          status?: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
          source_playlist_name: string;
          total_items?: number;
          imported_items?: number;
          failed_items?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          connected_account_id?: string | null;
          provider_transfer_id?: string | null;
          status?: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
          source_playlist_name?: string;
          total_items?: number;
          imported_items?: number;
          failed_items?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      import_transfer_events: {
        Row: {
          id: string;
          transfer_id: string;
          event_type: string;
          payload: Json;
          received_at: string;
        };
        Insert: {
          id?: string;
          transfer_id: string;
          event_type: string;
          payload: Json;
          received_at?: string;
        };
        Update: {
          id?: string;
          transfer_id?: string;
          event_type?: string;
          payload?: Json;
          received_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

