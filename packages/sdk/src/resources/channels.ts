import type { YtChannel } from "@yt-harness/shared";
import type { HttpClient } from "../http/client.js";

export class ChannelsResource {
  constructor(private http: HttpClient) {}

  async list(): Promise<YtChannel[]> {
    return this.http.get<YtChannel[]>("/api/channels");
  }

  async get(id: number): Promise<YtChannel> {
    return this.http.get<YtChannel>(`/api/channels/${id}`);
  }

  async delete(id: number): Promise<void> {
    return this.http.delete(`/api/channels/${id}`);
  }
}
