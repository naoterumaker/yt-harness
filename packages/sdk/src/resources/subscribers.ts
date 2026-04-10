import type { Subscriber, SubscriberSnapshot } from "@yt-harness/shared";
import type { HttpClient } from "../http/client.js";

export interface ListSubscribersOptions {
  limit?: number;
  offset?: number;
}

export class SubscribersResource {
  constructor(private http: HttpClient) {}

  async list(channelId: string, opts?: ListSubscribersOptions): Promise<Subscriber[]> {
    const params: Record<string, string> = { channelId };
    if (opts?.limit !== undefined) params.limit = String(opts.limit);
    if (opts?.offset !== undefined) params.offset = String(opts.offset);
    return this.http.get<Subscriber[]>("/api/subscribers", params);
  }

  async getSnapshots(channelId: string, days?: number): Promise<SubscriberSnapshot[]> {
    const params: Record<string, string> = { channelId };
    if (days !== undefined) params.days = String(days);
    return this.http.get<SubscriberSnapshot[]>("/api/subscribers/snapshots", params);
  }
}
