import { HttpClient } from "./http/client.js";
import { ChannelsResource } from "./resources/channels.js";
import { VideosResource } from "./resources/videos.js";
import { CommentsResource } from "./resources/comments.js";
import { GatesResource } from "./resources/gates.js";
import { SubscribersResource } from "./resources/subscribers.js";
import { SequencesResource } from "./resources/sequences.js";
import { PlaylistsResource } from "./resources/playlists.js";
import { AnalyticsResource } from "./resources/analytics.js";
import { QuotaResource } from "./resources/quota.js";
import { TagsResource } from "./resources/tags.js";
import { StaffResource } from "./resources/staff.js";
import { CampaignsResource } from "./resources/campaigns.js";

export interface YTHarnessConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

export class YTHarness {
  readonly channels: ChannelsResource;
  readonly videos: VideosResource;
  readonly comments: CommentsResource;
  readonly gates: GatesResource;
  readonly subscribers: SubscribersResource;
  readonly sequences: SequencesResource;
  readonly playlists: PlaylistsResource;
  readonly analytics: AnalyticsResource;
  readonly quota: QuotaResource;
  readonly tags: TagsResource;
  readonly staff: StaffResource;
  readonly campaigns: CampaignsResource;

  constructor(config: YTHarnessConfig) {
    const http = new HttpClient(config.baseUrl, config.apiKey, config.timeout);
    this.channels = new ChannelsResource(http);
    this.videos = new VideosResource(http);
    this.comments = new CommentsResource(http);
    this.gates = new GatesResource(http);
    this.subscribers = new SubscribersResource(http);
    this.sequences = new SequencesResource(http);
    this.playlists = new PlaylistsResource(http);
    this.analytics = new AnalyticsResource(http);
    this.quota = new QuotaResource(http);
    this.tags = new TagsResource(http);
    this.staff = new StaffResource(http);
    this.campaigns = new CampaignsResource(http);
  }
}
