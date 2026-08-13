export interface User {
  id: number;
  username: string;
  display_name: string;
  role: string;
  position?: string | null;
  team?: string | null;
  in_dashboard?: boolean;
  in_weekly?: boolean;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
}

export interface ProjectMember {
  user_id: number;
  display_name: string;
  position?: string | null;
  team?: string | null;
  role: string; // pm | member
}

export interface Project {
  id: number;
  code?: string | null;
  name: string;
  full_name?: string | null;
  description?: string | null;
  type_id?: number | null;
  type_name?: string | null;
  status_id?: number | null;
  status_name?: string | null;
  pm_user_id?: number | null;
  pm_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  nas_path?: string | null;
  git_url?: string | null;
  show_in_dashboard?: boolean;
  show_in_weekly?: boolean;
  sort_order?: number | null;
  member_count?: number;
  members?: ProjectMember[];
  created_at?: string;
  updated_at?: string;
}

export interface ProjectLog {
  id: number;
  actor_name?: string | null;
  action: string;
  field?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  created_at: string;
}

export interface ProjectMeta {
  id: number;
  name: string;
  sort_order: number;
}

export interface ProjectWeeklyItem {
  week_id: number;
  title: string;
  year: number;
  month: number;
  week_num: number;
  current_work: string[];
  next_work: string[];
}

export interface DashboardItem {
  project_id: number;
  code?: string | null;
  name: string;
  type_name?: string | null;
  status_name?: string | null;
  pm_name?: string | null;
  member_count: number;
  member_names: string[];
  start_date?: string | null;
  end_date?: string | null;
}

export interface CountItem {
  name: string;
  count: number;
}

export interface DashboardResponse {
  total: number;
  by_status: CountItem[];
  by_type: CountItem[];
  items: DashboardItem[];
}

// 프로젝트 생성/수정 페이로드
export interface ProjectPayload {
  code?: string | null;
  name: string;
  full_name?: string | null;
  description?: string | null;
  type_id?: number | null;
  pm_user_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  nas_path?: string | null;
  git_url?: string | null;
  show_in_dashboard?: boolean;
  show_in_weekly?: boolean;
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
