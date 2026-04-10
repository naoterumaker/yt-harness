export type GateTrigger = "comment" | "subscribe" | "like" | "comment_keyword";

export type GateAction = "reply" | "pin_comment" | "verify_only";

export type DeliveryStatus = "delivered" | "failed" | "skipped_lottery";

export interface CommentGate {
  id: number;
  channel_id: string;
  video_id: string;
  name: string;
  trigger: GateTrigger;
  trigger_keyword: string | null;
  action: GateAction;
  reply_template: string | null;
  lottery_rate: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentGateDelivery {
  id: number;
  gate_id: number;
  subscriber_id: number | null;
  youtube_channel_id: string;
  comment_id: string | null;
  delivered_at: string;
  delivery_status: DeliveryStatus;
}
