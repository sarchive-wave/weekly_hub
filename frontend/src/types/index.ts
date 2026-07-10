export interface User {
  id: number;
  username: string;
  display_name: string;
  role: string;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  sort_order: number | null;
}

export interface Week {
  id: number;
  year: number;
  month: number;
  week_num: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  total_members: number;
  done_members: number;
}

export interface MemberStatus {
  user_id: number;
  display_name: string;
  status: 'none' | 'draft' | 'done';
  sort_order: number | null;
}

export interface ProjectSummaryItem {
  project_id: number;
  project_name: string;
  current_work: string[];
  next_work: string[];
}

export interface OverallSummary {
  week_id: number;
  title: string;
  projects: ProjectSummaryItem[];
}

export interface EntryData {
  project_id: number;
  current_work: string;
  next_work: string;
}

export interface ReportEntry extends EntryData {
  project_name: string;
}

export interface Report {
  week_id: number;
  user_id: number;
  status: 'none' | 'draft' | 'done';
  entries: ReportEntry[];
}

export interface AuthUser {
  id: number;
  username: string;
  display_name: string;
  role: string;
}
