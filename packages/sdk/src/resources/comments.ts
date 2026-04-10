import type { Comment } from "@yt-harness/shared";
import type { HttpClient } from "../http/client.js";

export interface ListCommentsOptions {
  limit?: number;
  offset?: number;
}

export class CommentsResource {
  constructor(private http: HttpClient) {}

  async list(videoId: string, opts?: ListCommentsOptions): Promise<Comment[]> {
    const params: Record<string, string> = { videoId };
    if (opts?.limit !== undefined) params.limit = String(opts.limit);
    if (opts?.offset !== undefined) params.offset = String(opts.offset);
    return this.http.get<Comment[]>("/api/comments", params);
  }

  async insert(videoId: string, text: string): Promise<Comment> {
    return this.http.post<Comment>("/api/comments", { videoId, text });
  }

  async reply(commentId: string, text: string): Promise<Comment> {
    return this.http.post<Comment>(`/api/comments/${commentId}/reply`, { text });
  }

  async moderate(commentId: string, status: string): Promise<void> {
    return this.http.post(`/api/comments/${commentId}/moderate`, { status });
  }

  async delete(commentId: string): Promise<void> {
    return this.http.delete(`/api/comments/${commentId}`);
  }
}
