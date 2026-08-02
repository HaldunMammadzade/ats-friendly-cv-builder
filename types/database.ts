/**
 * Hand-maintained mirror of supabase/migrations/*.sql.
 * Regenerate with:
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 *
 * The `Relationships` key on every table is required by postgrest-js; without
 * it the schema fails its constraint check and every query degrades to `any`.
 */
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
          email: string | null;
          full_name: string | null;
          headline: string | null;
          avatar_url: string | null;
          locale: string;
          onboarded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          headline?: string | null;
          avatar_url?: string | null;
          locale?: string;
          onboarded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          headline?: string | null;
          avatar_url?: string | null;
          locale?: string;
          onboarded?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          data: Json;
          ats_score: number | null;
          target_role: string;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          data?: Json;
          ats_score?: number | null;
          target_role?: string;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          data?: Json;
          ats_score?: number | null;
          target_role?: string;
          is_archived?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      resume_versions: {
        Row: {
          id: string;
          resume_id: string;
          user_id: string;
          version: number;
          label: string;
          data: Json;
          ats_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          user_id: string;
          version?: number;
          label?: string;
          data: Json;
          ats_score?: number | null;
          created_at?: string;
        };
        Update: {
          label?: string;
          data?: Json;
          ats_score?: number | null;
        };
        Relationships: [];
      };
      cover_letters: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string | null;
          title: string;
          company: string;
          role: string;
          tone: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id?: string | null;
          title?: string;
          company?: string;
          role?: string;
          tone?: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          resume_id?: string | null;
          title?: string;
          company?: string;
          role?: string;
          tone?: string;
          body?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      job_targets: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string | null;
          company: string;
          role: string;
          job_description: string;
          match_score: number | null;
          matched_keywords: Json;
          missing_keywords: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id?: string | null;
          company?: string;
          role?: string;
          job_description?: string;
          match_score?: number | null;
          matched_keywords?: Json;
          missing_keywords?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          resume_id?: string | null;
          company?: string;
          role?: string;
          job_description?: string;
          match_score?: number | null;
          matched_keywords?: Json;
          missing_keywords?: Json;
          updated_at?: string;
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

type PublicTables = Database["public"]["Tables"];

export type ProfileRow = PublicTables["profiles"]["Row"];
export type ResumeRow = PublicTables["resumes"]["Row"];
export type ResumeVersionRow = PublicTables["resume_versions"]["Row"];
export type CoverLetterRow = PublicTables["cover_letters"]["Row"];
export type JobTargetRow = PublicTables["job_targets"]["Row"];

export type ResumeInsert = PublicTables["resumes"]["Insert"];
export type ResumeUpdate = PublicTables["resumes"]["Update"];
