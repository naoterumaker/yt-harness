import type { CommentSequence, SequenceMessage, SequenceEnrollment } from "@yt-harness/shared";
import type { HttpClient } from "../http/client.js";

export class SequencesResource {
  constructor(private http: HttpClient) {}

  async list(channelId: string): Promise<CommentSequence[]> {
    return this.http.get<CommentSequence[]>("/api/sequences", { channelId });
  }

  async create(data: Partial<CommentSequence>): Promise<CommentSequence> {
    return this.http.post<CommentSequence>("/api/sequences", data);
  }

  async addMessage(sequenceId: number, data: Partial<SequenceMessage>): Promise<SequenceMessage> {
    return this.http.post<SequenceMessage>(`/api/sequences/${sequenceId}/messages`, data);
  }

  async getEnrollments(sequenceId: number): Promise<SequenceEnrollment[]> {
    return this.http.get<SequenceEnrollment[]>(`/api/sequences/${sequenceId}/enrollments`);
  }
}
