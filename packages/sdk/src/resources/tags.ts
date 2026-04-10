import type { Tag, SubscriberTag } from "@yt-harness/shared";
import type { HttpClient } from "../http/client.js";

export class TagsResource {
  constructor(private http: HttpClient) {}

  async list(channelId: string): Promise<Tag[]> {
    return this.http.get<Tag[]>("/api/tags", { channelId });
  }

  async create(data: Partial<Tag>): Promise<Tag> {
    return this.http.post<Tag>("/api/tags", data);
  }

  async delete(id: number): Promise<void> {
    return this.http.delete(`/api/tags/${id}`);
  }

  async tagSubscriber(subscriberId: number, tagId: number): Promise<SubscriberTag> {
    return this.http.post<SubscriberTag>(`/api/subscribers/${subscriberId}/tags`, { tagId });
  }

  async untagSubscriber(subscriberId: number, tagId: number): Promise<void> {
    return this.http.delete(`/api/subscribers/${subscriberId}/tags/${tagId}`);
  }
}
