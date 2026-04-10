import { YouTubeHttpClient } from "./http/client.js";
import { VideosResource } from "./resources/videos.js";
import { CommentsResource } from "./resources/comments.js";
import { ChannelsResource } from "./resources/channels.js";
import { PlaylistsResource } from "./resources/playlists.js";
import { AnalyticsResource } from "./resources/analytics.js";

export interface YouTubeClientConfig {
  accessToken: string;
  channelId?: string;
}

export class YouTubeClient {
  public readonly videos: VideosResource;
  public readonly comments: CommentsResource;
  public readonly channels: ChannelsResource;
  public readonly playlists: PlaylistsResource;
  public readonly analytics: AnalyticsResource;
  public readonly channelId?: string;

  private http: YouTubeHttpClient;

  constructor(config: YouTubeClientConfig) {
    this.http = new YouTubeHttpClient(config.accessToken);
    this.channelId = config.channelId;

    this.videos = new VideosResource(this.http);
    this.comments = new CommentsResource(this.http);
    this.channels = new ChannelsResource(this.http);
    this.playlists = new PlaylistsResource(this.http);
    this.analytics = new AnalyticsResource(this.http);
  }
}
