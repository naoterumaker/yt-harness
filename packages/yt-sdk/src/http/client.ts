export const BASE_URL = "https://www.googleapis.com/youtube/v3";
export const ANALYTICS_URL = "https://youtubeanalytics.googleapis.com/v2";

export class YouTubeApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "YouTubeApiError";
  }
}

export interface YouTubeHttpOptions {
  method?: string;
  params?: Record<string, string>;
  body?: unknown;
  baseUrl?: string;
}

export class YouTubeHttpClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Make an authenticated request to the YouTube API.
   */
  async fetch<T>(
    endpoint: string,
    options: YouTubeHttpOptions = {},
  ): Promise<T> {
    const {
      method = "GET",
      params,
      body,
      baseUrl = BASE_URL,
    } = options;

    const url = new URL(`${baseUrl}/${endpoint}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      Accept: "application/json",
    };

    const init: RequestInit = { method, headers };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }

    const res = await globalThis.fetch(url.toString(), init);

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({})) as {
        error?: { errors?: Array<{ reason?: string }>; message?: string };
      };
      const reason =
        errorBody?.error?.errors?.[0]?.reason ?? "unknown";
      const message =
        errorBody?.error?.message ?? `HTTP ${res.status}`;

      throw new YouTubeApiError(res.status, reason, message);
    }

    // 204 No Content
    if (res.status === 204) {
      return undefined as T;
    }

    return res.json() as Promise<T>;
  }
}
