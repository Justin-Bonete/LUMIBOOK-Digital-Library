export type Role = 'admin' | 'member';
export interface Usage { used: number; limit: number | null; remaining: number | null; period: 'lifetime' | 'month' }
export interface PlanRef { code: 'free' | 'premium' | 'plus' | 'all'; name: string; tier: number }
export interface Summary { plan: PlanRef; usage: Usage; titles_unlocked: number }
export interface Me extends Summary { user: { id: number; name: string; email: string; role: Role } }
export interface LibraryTitle { id: number; title: string; author: string; category: string; description: string | null; cover_url: string | null; file_size: number | null; unlocked: boolean }
export interface TitleDetail extends LibraryTitle { required_plan: { code: string; name: string } | null; related: LibraryTitle[] }
export interface Category { category: string; total: number }
export interface PlanInfo { id: number; code: string; name: string; ebook_limit: number | null; titles_count?: number }
export interface PlanDetail extends PlanInfo { title_ids: number[] }
export interface Paged<T> { data: T[]; current_page: number; last_page: number; total: number }
export interface AdminUser extends Summary { id: number; name: string; email: string; role: Role; status: 'active' | 'suspended'; created_at: string; last_download_at: string | null }
export interface UserTrace {
  user: { id: number; name: string; email: string; status: 'active' | 'suspended'; created_at: string };
  summary: Summary;
  entitlements: { id: number; status: string; created_at: string; plan: { name: string; code: string }; granted_by: { name: string } | null }[];
  orders: { id: number; order_number: string; status: string; amount: string; plan: { name: string } }[];
  downloads: { id: number; status: string; created_at: string; title: { title: string } }[];
  audit: { id: number; action: string; created_at: string; metadata: Record<string, unknown> | null }[];
}
export interface Stats { members: number; suspended: number; by_plan: Record<string, number>; at_limit: number; downloads_30d: number }
export interface AdminTitle { id: number; title: string; author: string; category: string; cover_url: string | null; file_size: number | null; rights_status: 'pending' | 'cleared' | 'blocked'; visibility: 'draft' | 'published'; plans_count: number }
export interface AuditRow { id: number; action: string; entity_type: string | null; entity_id: number | null; created_at: string; actor: { name: string } | null }
export interface HistoryRow { id: number; status: string; created_at: string; title: { title: string; author: string } }
