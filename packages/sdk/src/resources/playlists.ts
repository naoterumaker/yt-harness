import type { Playlist } from "@yt-harness/shared";
import type { HttpClient } from "../http/client.js";

export class PlaylistsResource {
  constructor(private http: HttpClient) {}

  async list(channelId: string): Promise<Playlist[]> {
    return this.http.get<Playlist[]>("/api/playlists", { channelId });
  }

  async create(data: Partial<Playlist>): Promise<Playlist> {
    return this.http.post<Playlist>("/api/playlists", data);
  }

  async update(id: number, data: Partial<Playlist>): Promise<Playlist> {
    return this.http.put<Playlist>(`/api/playlists/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    return this.http.delete(`/api/playlists/${id}`);
  }

  async addVideo(id: number, videoId: string): Promise<void> {
    return this.http.post(`/api/playlists/${id}/videos`, { videoId });
  }
}
