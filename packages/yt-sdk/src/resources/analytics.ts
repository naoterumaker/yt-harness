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
}
