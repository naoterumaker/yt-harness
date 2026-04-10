import type { Video } from "@yt-harness/shared";
import type { HttpClient } from "../http/client.js";

export interface ListVideosOptions {
  status?: string;
  limit?: number;
  offset?: number;
}

export class VideosResource {
  constructor(private http: HttpClient) {}

  async list(channelId: string, opts?: ListVideosOptions): Promise<Video[]> {
    const params: Record<string, string> = { channelId };
    if (opts?.status) params.status = opts.status;
    if (opts?.limit !== undefined) params.limit = String(opts.limit);
    if (opts?.offset !== undefined) params.offset = String(opts.offset);
    return this.http.get<Video[]>("/api/videos", params);
  }

  async get(id: number): Promise<Video> {
    return this.http.get<Video>(`/api/videos/${id}`);
  }

  async update(id: number, data: Partial<Video>): Promise<Video> {
    return this.http.put<Video>(`/api/videos/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    return this.http.delete(`/api/videos/${id}`);
  }

  async getMetrics(id: number): Promise<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`/api/videos/${id}/metrics`);
  }

  async rate(id: number, rating: string): Promise<void> {
    return this.http.post(`/api/videos/${id}/rate`, { rating });
  }

  async schedulePublish(id: number, publishAt: string): Promise<Video> {
    return this.http.post<Video>(`/api/videos/${id}/schedule`, { publishAt });
  }
}
