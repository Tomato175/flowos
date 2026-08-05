// ============================================================
// @flow/api — Supabase Database 类型（由 generate-types 脚本生成）
// 占位文件，后续通过 `supabase gen types` 自动生成
// ============================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          timezone: string;
          theme: string;
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          theme?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          theme?: string;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: string;
          priority: number;
          due_date: string | null;
          estimated_minutes: number | null;
          project_id: string | null;
          parent_task_id: string | null;
          is_recurring: boolean;
          recurring_rule: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: string;
          priority?: number;
          due_date?: string | null;
          estimated_minutes?: number | null;
          project_id?: string | null;
          parent_task_id?: string | null;
          is_recurring?: boolean;
          recurring_rule?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: string;
          priority?: number;
          due_date?: string | null;
          estimated_minutes?: number | null;
          project_id?: string | null;
          parent_task_id?: string | null;
          is_recurring?: boolean;
          recurring_rule?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
