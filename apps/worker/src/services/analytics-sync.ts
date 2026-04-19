import { analyticsDaily, trafficSources, viewerDemographics } from "@yt-harness/db";
import type { YtChannel } from "@yt-harness/shared";
import type { Env } from "../middleware/auth.js";

const ANALYTICS_API_URL = "https://youtubeanalytics.googleapis.com/v2/reports";

/** Metrics to request from the YouTube Analytics API */
// NOTE: videoThumbnailImpressions/CTR は day dimension と組み合わせ不可（API制約）
// Reporting API (channel_reach_basic_a1) で別途取得する必要がある
const METRICS = [
  "views",
  "estimatedMinutesWatched",
  "averageViewDuration",
  "subscribersGained",
  "subscribersLost",
  "likes",
  "comments",
  "shares",
].join(",");

/** Map column names from the API to our DB column names */
const COLUMN_MAP: Record<string, string> = {
  day: "analytics_date",
  videoThumbnailImpressions: "video_thumbnail_impressions",
  videoThumbnailImpressionsClickRate: "video_thumbnail_impressions_ctr",
  views: "views",
  estimatedMinutesWatched: "estimated_minutes_watched",
  averageViewDuration: "average_view_duration",
  subscribersGained: "subscribers_gained",
  subscribersLost: "subscribers_lost",
  likes: "likes",
  comments: "comments",
  shares: "shares",
};

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Sync analytics from YouTube Analytics API into analytics_daily table.
 * Uses a 7-day lookback window to handle Analytics API reporting delays.
 */
export async function syncAnalytics(
  env: Env,
  channel: YtChannel,
): Promise<{ upserted: number }> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  const url = new URL(ANALYTICS_API_URL);
  url.searchParams.set("ids", "channel==MINE");
  url.searchParams.set("startDate", startStr);
  url.searchParams.set("endDate", endStr);
  url.searchParams.set("metrics", METRICS);
  url.searchParams.set("dimensions", "day");
  url.searchParams.set("sort", "day");

  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${channel.access_token}` },
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`YouTube Analytics API error: ${resp.status} — ${err}`);
  }

  const data = (await resp.json()) as {
    columnHeaders: Array<{ name: string }>;
    rows: Array<Array<string | number>>;
  };

  const headers = data.columnHeaders.map((h) => h.name);
  let upserted = 0;

  for (const row of data.rows ?? []) {
    const record: Record<string, string | number | null> = {};
    for (let i = 0; i < headers.length; i++) {
      const dbCol = COLUMN_MAP[headers[i]];
      if (dbCol) {
        record[dbCol] = row[i] ?? null;
      }
    }

    await analyticsDaily.upsertDaily(env.DB, {
      channel_id: channel.channel_id,
      video_id: "__CHANNEL__",
      analytics_date: String(record["analytics_date"]),
      video_thumbnail_impressions: null, // Reporting API で別途取得
      video_thumbnail_impressions_ctr: null,
      views: (record["views"] as number) ?? null,
      estimated_minutes_watched: (record["estimated_minutes_watched"] as number) ?? null,
      average_view_duration: (record["average_view_duration"] as number) ?? null,
      average_view_percentage: null,
      subscribers_gained: (record["subscribers_gained"] as number) ?? null,
      subscribers_lost: (record["subscribers_lost"] as number) ?? null,
      likes: (record["likes"] as number) ?? null,
      comments: (record["comments"] as number) ?? null,
      shares: (record["shares"] as number) ?? null,
      engaged_views: null,
    });
    upserted++;
  }

  return { upserted };
}

/**
 * Sync traffic sources from YouTube Analytics API.
 * Uses a 7-day lookback window.
 */
export async function syncTrafficSources(
  env: Env,
  channel: YtChannel,
): Promise<{ upserted: number }> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  const url = new URL(ANALYTICS_API_URL);
  url.searchParams.set("ids", "channel==MINE");
  url.searchParams.set("startDate", startStr);
  url.searchParams.set("endDate", endStr);
  url.searchParams.set("metrics", "views,estimatedMinutesWatched");
  url.searchParams.set("dimensions", "day,insightTrafficSourceType");
  url.searchParams.set("sort", "day");

  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${channel.access_token}` },
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`YouTube Analytics API error (traffic): ${resp.status} — ${err}`);
  }

  const data = (await resp.json()) as {
    columnHeaders: Array<{ name: string }>;
    rows: Array<Array<string | number>>;
  };

  const headers = data.columnHeaders.map((h) => h.name);
  let upserted = 0;

  for (const row of data.rows ?? []) {
    const record: Record<string, string | number | null> = {};
    for (let i = 0; i < headers.length; i++) {
      record[headers[i]] = row[i] ?? null;
    }

    await trafficSources.upsert(env.DB, {
      channel_id: channel.channel_id,
      video_id: "__CHANNEL__",
      analytics_date: String(record["day"]),
      traffic_type: String(record["insightTrafficSourceType"]),
      views: (record["views"] as number) ?? 0,
      estimated_minutes_watched: (record["estimatedMinutesWatched"] as number) ?? 0,
    });
    upserted++;
  }

  return { upserted };
}

/**
 * Sync demographics from YouTube Analytics API.
 * Fetches both percentage-based (ageGroup, gender) and count-based (country, deviceType).
 * Uses a 7-day lookback window.
 */
export async function syncDemographics(
  env: Env,
  channel: YtChannel,
): Promise<{ upsertedPct: number; upsertedCounts: number }> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  let upsertedPct = 0;
  let upsertedCounts = 0;

  // Percentage-based dimensions: ageGroup, gender
  for (const dimension of ["ageGroup", "gender"] as const) {
    const url = new URL(ANALYTICS_API_URL);
    url.searchParams.set("ids", "channel==MINE");
    url.searchParams.set("startDate", startStr);
    url.searchParams.set("endDate", endStr);
    url.searchParams.set("metrics", "viewerPercentage");
    url.searchParams.set("dimensions", dimension);
    url.searchParams.set("sort", dimension);

    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${channel.access_token}` },
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`YouTube Analytics API error (demographics ${dimension}): ${resp.status} — ${err}`);
    }

    const data = (await resp.json()) as {
      columnHeaders: Array<{ name: string }>;
      rows: Array<Array<string | number>>;
    };

    for (const row of data.rows ?? []) {
      await viewerDemographics.upsertPct(env.DB, {
        channel_id: channel.channel_id,
        video_id: "__CHANNEL__",
        analytics_date: endStr,
        dimension_type: dimension,
        dimension_value: String(row[0]),
        viewer_percentage: (row[1] as number) ?? null,
      });
      upsertedPct++;
    }
  }

  // Count-based dimensions: country, deviceType
  for (const dimension of ["country", "deviceType"] as const) {
    const url = new URL(ANALYTICS_API_URL);
    url.searchParams.set("ids", "channel==MINE");
    url.searchParams.set("startDate", startStr);
    url.searchParams.set("endDate", endStr);
    url.searchParams.set("metrics", "views,estimatedMinutesWatched");
    url.searchParams.set("dimensions", dimension);
    url.searchParams.set("sort", "-views");

    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${channel.access_token}` },
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`YouTube Analytics API error (demographics ${dimension}): ${resp.status} — ${err}`);
    }

    const data = (await resp.json()) as {
      columnHeaders: Array<{ name: string }>;
      rows: Array<Array<string | number>>;
    };

    for (const row of data.rows ?? []) {
      await viewerDemographics.upsertCounts(env.DB, {
        channel_id: channel.channel_id,
        video_id: "__CHANNEL__",
        analytics_date: endStr,
        dimension_type: dimension,
        dimension_value: String(row[0]),
        views: (row[1] as number) ?? null,
        estimated_minutes_watched: (row[2] as number) ?? null,
      });
      upsertedCounts++;
    }
  }

  return { upsertedPct, upsertedCounts };
}
