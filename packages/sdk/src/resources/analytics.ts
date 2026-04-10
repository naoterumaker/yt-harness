import type { HttpClient } from "../http/client.js";

export class AnalyticsResource {
  constructor(private http: HttpClient) {}

  async getChannel(channelId: string, params?: Record<string, string>): Promise<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`/api/analytics/channels/${channelId}`, params);
  }

  async getVideo(videoId: string, params?: Record<string, string>): Promise<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`/api/analytics/videos/${videoId}`, params);
  }
}
