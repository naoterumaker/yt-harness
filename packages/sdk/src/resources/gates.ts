import type { CommentGate, CommentGateDelivery } from "@yt-harness/shared";
import type { HttpClient } from "../http/client.js";

export class GatesResource {
  constructor(private http: HttpClient) {}

  async list(channelId: string): Promise<CommentGate[]> {
    return this.http.get<CommentGate[]>("/api/gates", { channelId });
  }

  async create(data: Partial<CommentGate>): Promise<CommentGate> {
    return this.http.post<CommentGate>("/api/gates", data);
  }

  async update(id: number, data: Partial<CommentGate>): Promise<CommentGate> {
    return this.http.put<CommentGate>(`/api/gates/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    return this.http.delete(`/api/gates/${id}`);
  }

  async process(id: number): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`/api/gates/${id}/process`);
  }

  async verify(id: number, commentId: string): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`/api/gates/${id}/verify`, { commentId });
  }

  async getDeliveries(id: number): Promise<CommentGateDelivery[]> {
    return this.http.get<CommentGateDelivery[]>(`/api/gates/${id}/deliveries`);
  }

  async getAnalytics(id: number): Promise<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`/api/gates/${id}/analytics`);
  }
}
