export type SequenceEnrollmentStatus = "active" | "completed" | "paused" | "cancelled";

export interface CommentSequence {
  id: number;
  channel_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SequenceMessage {
  id: number;
  sequence_id: number;
  step_order: number;
  delay_minutes: number;
  message_template: string;
  created_at: string;
}

export interface SequenceEnrollment {
  id: number;
  sequence_id: number;
  subscriber_id: number;
  current_step: number;
  status: SequenceEnrollmentStatus;
  enrolled_at: string;
  last_sent_at: string | null;
  updated_at: string;
}
