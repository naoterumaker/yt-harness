import type { Campaign } from "@yt-harness/shared";
import type { HttpClient } from "../http/client.js";

export class CampaignsResource {
  constructor(private http: HttpClient) {}

  async list(channelId: string): Promise<Campaign[]> {
    return this.http.get<Campaign[]>("/api/campaigns", { channelId });
  }

  async create(data: Partial<Campaign>): Promise<Campaign> {
    return this.http.post<Campaign>("/api/campaigns", data);
  }

  async update(id: number, data: Partial<Campaign>): Promise<Campaign> {
    return this.http.put<Campaign>(`/api/campaigns/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    return this.http.delete(`/api/campaigns/${id}`);
  }
}
