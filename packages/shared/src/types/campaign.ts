export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export interface Campaign {
  id: number;
  channel_id: string;
  name: string;
  description: string | null;
  gate_id: number | null;
  sequence_id: number | null;
  status: CampaignStatus;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}
