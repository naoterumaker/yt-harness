export interface QuotaUsage {
  id: number;
  channel_id: string;
  endpoint: string;
  units_used: number;
  used_at: string;
}
