export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string | null; display_name: string | null; avatar_url: string | null; timezone: string; theme: string; created_at: string };
        Insert: { id: string; username?: string | null; display_name?: string | null; avatar_url?: string | null; timezone?: string; theme?: string; created_at?: string };
        Update: { id?: string; username?: string | null; display_name?: string | null; avatar_url?: string | null; timezone?: string; theme?: string; created_at?: string };
      };
      projects: {
        Row: { id: string; user_id: string; name: string; color: string | null; icon: string | null; is_archived: boolean; sort_order: number; created_at: string };
        Insert: { id?: string; user_id: string; name: string; color?: string | null; icon?: string | null; is_archived?: boolean; sort_order?: number; created_at?: string };
        Update: { id?: string; user_id?: string; name?: string; color?: string | null; icon?: string | null; is_archived?: boolean; sort_order?: number; created_at?: string };
      };
      tasks: {
        Row: { id: string; user_id: string; title: string; description: string; status: string; priority: number; due_date: string | null; estimated_minutes: number | null; project_id: string | null; tags: string[]; is_recurring: boolean; recurring_rule: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; title: string; description?: string; status?: string; priority?: number; due_date?: string | null; estimated_minutes?: number | null; project_id?: string | null; tags?: string[]; is_recurring?: boolean; recurring_rule?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; title?: string; description?: string; status?: string; priority?: number; due_date?: string | null; estimated_minutes?: number | null; project_id?: string | null; tags?: string[]; is_recurring?: boolean; recurring_rule?: string | null; created_at?: string; updated_at?: string };
      };
      focus_sessions: {
        Row: { id: string; user_id: string; task_id: string | null; task_title: string | null; started_at: string; ended_at: string | null; duration_minutes: number; session_type: string; pomodoro_cycle: number; completed: boolean; created_at: string };
        Insert: { id?: string; user_id: string; task_id?: string | null; task_title?: string | null; started_at: string; ended_at?: string | null; duration_minutes?: number; session_type?: string; pomodoro_cycle?: number; completed?: boolean; created_at?: string };
        Update: { id?: string; user_id?: string; task_id?: string | null; task_title?: string | null; started_at?: string; ended_at?: string | null; duration_minutes?: number; session_type?: string; pomodoro_cycle?: number; completed?: boolean; created_at?: string };
      };
      habits: {
        Row: { id: string; user_id: string; name: string; icon: string; color: string; frequency_type: string; frequency_count: number; reminder_time: string | null; is_archived: boolean; created_at: string };
        Insert: { id?: string; user_id: string; name: string; icon?: string; color?: string; frequency_type?: string; frequency_count?: number; reminder_time?: string | null; is_archived?: boolean; created_at?: string };
        Update: { id?: string; user_id?: string; name?: string; icon?: string; color?: string; frequency_type?: string; frequency_count?: number; reminder_time?: string | null; is_archived?: boolean; created_at?: string };
      };
      habit_logs: {
        Row: { id: string; user_id: string; habit_id: string; logged_date: string; completed: boolean };
        Insert: { id?: string; user_id: string; habit_id: string; logged_date: string; completed?: boolean };
        Update: { id?: string; user_id?: string; habit_id?: string; logged_date?: string; completed?: boolean };
      };
      objectives: {
        Row: { id: string; user_id: string; title: string; description: string; time_period: string; color: string; status: string; created_at: string };
        Insert: { id?: string; user_id: string; title: string; description?: string; time_period?: string; color?: string; status?: string; created_at?: string };
        Update: { id?: string; user_id?: string; title?: string; description?: string; time_period?: string; color?: string; status?: string; created_at?: string };
      };
      key_results: {
        Row: { id: string; objective_id: string; title: string; target_value: number; current_value: number; unit: string; task_ids: string[]; created_at: string };
        Insert: { id?: string; objective_id: string; title: string; target_value?: number; current_value?: number; unit?: string; task_ids?: string[]; created_at?: string };
        Update: { id?: string; objective_id?: string; title?: string; target_value?: number; current_value?: number; unit?: string; task_ids?: string[]; created_at?: string };
      };
      notes: {
        Row: { id: string; user_id: string; title: string; content: string; note_type: string; journal_date: string | null; tags: string[]; is_pinned: boolean; is_archived: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; title?: string; content?: string; note_type?: string; journal_date?: string | null; tags?: string[]; is_pinned?: boolean; is_archived?: boolean; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; title?: string; content?: string; note_type?: string; journal_date?: string | null; tags?: string[]; is_pinned?: boolean; is_archived?: boolean; created_at?: string; updated_at?: string };
      };
      mood_entries: {
        Row: { id: string; user_id: string; mood: string; intensity: number; notes: string | null; recorded_date: string; created_at: string };
        Insert: { id?: string; user_id: string; mood: string; intensity?: number; notes?: string | null; recorded_date?: string; created_at?: string };
        Update: { id?: string; user_id?: string; mood?: string; intensity?: number; notes?: string | null; recorded_date?: string; created_at?: string };
      };
      calendar_events: {
        Row: { id: string; user_id: string; title: string; description: string; start_time: string; end_time: string; is_all_day: boolean; event_type: string; task_id: string | null; color: string | null; created_at: string };
        Insert: { id?: string; user_id: string; title: string; description?: string; start_time: string; end_time: string; is_all_day?: boolean; event_type?: string; task_id?: string | null; color?: string | null; created_at?: string };
        Update: { id?: string; user_id?: string; title?: string; description?: string; start_time?: string; end_time?: string; is_all_day?: boolean; event_type?: string; task_id?: string | null; color?: string | null; created_at?: string };
      };
    };
  };
}
