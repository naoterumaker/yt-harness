import { ANALYTICS_URL, type YouTubeHttpClient } from "../http/client.js";

export interface AnalyticsQueryParams {
  startDate: string;
  endDate: string;
  metrics: string;
  dimensions?: string;
  filters?: string;
  sort?: string;
  maxResults?: number;
}

export interface YouTubeAnalyticsResponse {
  kind: string;
  columnHeaders: Array<{
    name: string;
    columnType: string;
    dataType: string;
  }>;
  rows: Array<Array<string | number>>;
}

export interface ChannelReportParams {
  startDate: string;
  endDate: string;
  metrics: string;
  dimensions?: string;
}

export class AnalyticsResource {
  constructor(private http: YouTubeHttpClient) {}

  /**
   * Query channel-level analytics.
   */
  async getChannelAnalytics(
    params: AnalyticsQueryParams,
  ): Promise<YouTubeAnalyticsResponse> {
    const queryParams: Record<string, string> = {
      ids: "channel==MINE",
      startDate: params.startDate,
      endDate: params.endDate,
      metrics: params.metrics,
    };
    if (params.dimensions) queryParams["dimensions"] = params.dimensions;
    if (params.filters) queryParams["filters"] = params.filters;
    if (params.sort) queryParams["sort"] = params.sort;
    if (params.maxResults)
      queryParams["maxResults"] = String(params.maxResults);

    return this.http.fetch<YouTubeAnalyticsResponse>("reports", {
      params: queryParams,
      baseUrl: ANALYTICS_URL,
    });
  }

  /**
   * Fetch a channel report from the YouTube Analytics API.
   * Uses ids=channel==MINE with Bearer token auth.
   * Base URL: https://youtubeanalytics.googleapis.com/v2/reports
   */
  async getChannelReport(
    params: ChannelReportParams,
  ): Promise<YouTubeAnalyticsResponse> {
    const queryParams: Record<string, string> = {
      ids: "channel==MINE",
      startDate: params.startDate,
      endDate: params.endDate,
      metrics: params.metrics,
    };
    if (params.dimensions) queryParams["dimensions"] = params.dimensions;

    return this.http.fetch<YouTubeAnalyticsResponse>("reports", {
      params: queryParams,
      baseUrl: ANALYTICS_URL,
    });
  }

  /**
   * Query analytics for a specific video.
   */
  async getVideoAnalytics(
    videoId: string,
    params: Omit<AnalyticsQueryParams, "filters">,
  ): Promise<YouTubeAnalyticsResponse> {
    const queryParams: Record<string, string> = {
      ids: "channel==MINE",
      startDate: params.startDate,
      endDate: params.endDate,
      metrics: params.metrics,
      filters: `video==${videoId}`,
    };
    if (params.dimensions) queryParams["dimensions"] = params.dimensions;
    if (params.sort) queryParams["sort"] = params.sort;
    if (params.maxResults)
      queryParams["maxResults"] = String(params.maxResults);

    return this.http.fetch<YouTubeAnalyticsResponse>("reports", {
      params: queryParams,
      baseUrl: ANALYTICS_URL,
    });
  }

  /**
   * Get traffic sources breakdown.
   * dimension=insightTrafficSourceType, metrics=views,estimatedMinutesWatched
   */
  async getTrafficSources(
    params: { startDate: string; endDate: string; videoId?: string },
  ): Promise<YouTubeAnalyticsResponse> {
    const queryParams: Record<string, string> = {
      ids: "channel==MINE",
      startDate: params.startDate,
      endDate: params.endDate,
      metrics: "views,estimatedMinutesWatched",
      dimensions: "day,insightTrafficSourceType",
      sort: "day",
    };
    if (params.videoId) queryParams["filters"] = `video==${params.videoId}`;

    return this.http.fetch<YouTubeAnalyticsResponse>("reports", {
      params: queryParams,
      baseUrl: ANALYTICS_URL,
    });
  }

  /**
   * Get demographics as percentage (viewerPercentage).
   * Works with ageGroup or gender dimension.
   */
  async getDemographicsPct(
    params: { startDate: string; endDate: string; dimension: "ageGroup" | "gender" },
  ): Promise<YouTubeAnalyticsResponse> {
    return this.http.fetch<YouTubeAnalyticsResponse>("reports", {
      params: {
        ids: "channel==MINE",
        startDate: params.startDate,
        endDate: params.endDate,
        metrics: "viewerPercentage",
        dimensions: params.dimension,
        sort: params.dimension,
      },
      baseUrl: ANALYTICS_URL,
    });
  }

  /**
   * Get demographics as absolute counts (views, estimatedMinutesWatched).
   * Works with country or deviceType dimension.
   */
  async getDemographicsCounts(
    params: { startDate: string; endDate: string; dimension: "country" | "deviceType" },
  ): Promise<YouTubeAnalyticsResponse> {
    return this.http.fetch<YouTubeAnalyticsResponse>("reports", {
      params: {
        ids: "channel==MINE",
        startDate: params.startDate,
        endDate: params.endDate,
        metrics: "views,estimatedMinutesWatched",
        dimensions: params.dimension,
        sort: `-views`,
      },
      baseUrl: ANALYTICS_URL,
    });
  }
}
