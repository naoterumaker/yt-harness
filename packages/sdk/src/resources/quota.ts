import type { QuotaUsage } from "@yt-harness/shared";
import type { HttpClient } from "../http/client.js";

export class QuotaResource {
  constructor(private http: HttpClient) {}

  async get(channelId: string): Promise<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`/api/quota/${channelId}`);
  }

  async getHistory(channelId: string, days?: number): Promise<QuotaUsage[]> {
    const params: Record<string, string> = {};
    if (days !== undefined) params.days = String(days);
    return this.http.get<QuotaUsage[]>(`/api/quota/${channelId}/history`, params);
  }
}
