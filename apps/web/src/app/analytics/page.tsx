'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { useChannel } from '@/lib/channel-context';
import { useApi } from '@/lib/use-api';
import {
  fetchAnalyticsDaily,
  fetchTrafficSources,
  fetchDemographicsPct,
  fetchDemographicsCounts,
  fetchSubscriberSnapshots,
  syncAllAnalytics,
  type AnalyticsDailyRow,
  type TrafficSourceRow,
  type DemographicsPctRow,
  type DemographicsCountsRow,
  type SubscriberSnapshot,
} from '@/lib/api';
import { formatNumber } from '@/lib/utils';

const periods = [
  { key: '7d', label: '過去7日間', days: 7 },
  { key: '28d', label: '過去28日間', days: 28 },
  { key: '90d', label: '過去90日間', days: 90 },
  { key: '365d', label: '過去1年間', days: 365 },
] as const;

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// Dark theme colors
const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  grid: '#374151',
  tooltipBg: '#1f2937',
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const TRAFFIC_COLORS: Record<string, string> = {
  SUGGESTED: '#3b82f6',
  SEARCH: '#10b981',
  EXTERNAL: '#f59e0b',
  BROWSE: '#8b5cf6',
  PLAYLIST: '#ec4899',
  NOTIFICATION: '#ef4444',
  OTHER: '#6b7280',
};

function NoDataMessage({ message }: { message: string }) {
  return (
    <div className="flex h-48 items-center justify-center text-sm text-gray-500">
      {message}
    </div>
  );
}

/** Aggregate daily rows by date (sum across videos) */
function aggregateDailyByDate(rows: AnalyticsDailyRow[]) {
  const byDate: Record<string, { views: number; watchMinutes: number; likes: number; comments: number; subscribersGained: number }> = {};

  for (const row of rows) {
    const key = row.analytics_date;
    if (!byDate[key]) {
      byDate[key] = { views: 0, watchMinutes: 0, likes: 0, comments: 0, subscribersGained: 0 };
    }
    byDate[key].views += row.views ?? 0;
    byDate[key].watchMinutes += row.estimated_minutes_watched ?? 0;
    byDate[key].likes += row.likes ?? 0;
    byDate[key].comments += row.comments ?? 0;
    byDate[key].subscribersGained += (row.subscribers_gained ?? 0) - (row.subscribers_lost ?? 0);
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date: date.slice(5), // MM-DD
      views: d.views,
      watchMinutes: d.watchMinutes,
      likes: d.likes,
      comments: d.comments,
      subscribersGained: d.subscribersGained,
    }));
}

/** Aggregate traffic data by traffic_type (sum views) */
function aggregateTraffic(rows: TrafficSourceRow[]) {
  const byType: Record<string, number> = {};
  for (const row of rows) {
    const type = row.traffic_type || 'OTHER';
    byType[type] = (byType[type] || 0) + row.views;
  }
  return Object.entries(byType)
    .sort(([, a], [, b]) => b - a)
    .map(([type, views]) => ({ traffic_type: type, views }));
}

/** Aggregate demographics pct by dimension_value (average percentage) */
function aggregateDemoPct(rows: DemographicsPctRow[]) {
  const byValue: Record<string, { total: number; count: number }> = {};
  for (const row of rows) {
    const val = row.dimension_value;
    if (!byValue[val]) byValue[val] = { total: 0, count: 0 };
    byValue[val].total += row.viewer_percentage ?? 0;
    byValue[val].count += 1;
  }
  return Object.entries(byValue)
    .map(([value, { total, count }]) => ({
      name: value,
      percentage: Math.round((total / count) * 100) / 100,
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

/** Aggregate demographics counts by dimension_value (sum views), top N */
function aggregateDemoCounts(rows: DemographicsCountsRow[], topN: number = 10) {
  const byValue: Record<string, number> = {};
  for (const row of rows) {
    const val = row.dimension_value;
    byValue[val] = (byValue[val] || 0) + (row.views ?? 0);
  }
  return Object.entries(byValue)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .map(([value, views]) => ({ name: value, views }));
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<string>('28d');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const { selected, loading: chLoading, error: chError } = useChannel();

  const selectedPeriod = periods.find((p) => p.key === period) ?? periods[1];
  const startDate = daysAgo(selectedPeriod.days);
  const endDate = new Date().toISOString().slice(0, 10);

  // Fetchers
  const dailyFetcher = useMemo(
    () => (selected ? () => fetchAnalyticsDaily(selected.id, startDate, endDate) : null),
    [selected, startDate, endDate],
  );
  const trafficFetcher = useMemo(
    () => (selected ? () => fetchTrafficSources(selected.id, startDate, endDate) : null),
    [selected, startDate, endDate],
  );
  const ageGroupFetcher = useMemo(
    () => (selected ? () => fetchDemographicsPct(selected.id, 'ageGroup', startDate, endDate) : null),
    [selected, startDate, endDate],
  );
  const genderFetcher = useMemo(
    () => (selected ? () => fetchDemographicsPct(selected.id, 'gender', startDate, endDate) : null),
    [selected, startDate, endDate],
  );
  const countryFetcher = useMemo(
    () => (selected ? () => fetchDemographicsCounts(selected.id, 'country', startDate, endDate) : null),
    [selected, startDate, endDate],
  );
  const snapshotsFetcher = useMemo(
    () => (selected ? () => fetchSubscriberSnapshots(selected.id) : null),
    [selected],
  );

  const { data: dailyData, loading: dLoading, refresh: refreshDaily } = useApi<{ data: AnalyticsDailyRow[] }>(dailyFetcher);
  const { data: trafficData, loading: tLoading, refresh: refreshTraffic } = useApi<{ data: TrafficSourceRow[] }>(trafficFetcher);
  const { data: ageData, loading: ageLoading, refresh: refreshAge } = useApi<{ data: DemographicsPctRow[] }>(ageGroupFetcher);
  const { data: genderData, loading: genderLoading, refresh: refreshGender } = useApi<{ data: DemographicsPctRow[] }>(genderFetcher);
  const { data: countryData, loading: countryLoading, refresh: refreshCountry } = useApi<{ data: DemographicsCountsRow[] }>(countryFetcher);
  const { data: snapshotsData, loading: sLoading, refresh: refreshSnapshots } = useApi<{ snapshots: SubscriberSnapshot[] }>(snapshotsFetcher);

  const handleSync = useCallback(async () => {
    if (!selected || syncing) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await syncAllAnalytics(selected.id);
      setSyncMessage(`同期完了: ${result.daily_upserted}日分のデータ、${result.traffic_upserted}件のトラフィック、${result.demographics_pct_upserted + result.demographics_counts_upserted}件のデモグラフィックス`);
      // Refresh all data
      refreshDaily();
      refreshTraffic();
      refreshAge();
      refreshGender();
      refreshCountry();
      refreshSnapshots();
    } catch {
      setSyncMessage('同期に失敗しました。再度お試しください。');
    } finally {
      setSyncing(false);
    }
  }, [selected, syncing, refreshDaily, refreshTraffic, refreshAge, refreshGender, refreshCountry, refreshSnapshots]);

  if (chLoading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">読み込み中...</div>;
  }
  if (chError) {
    return <div className="rounded-lg bg-red-900/30 p-4 text-red-300">{chError}</div>;
  }
  if (!selected) {
    return <div className="text-gray-400">チャンネルが登録されていません。</div>;
  }

  // Processed data
  const dailyRows = dailyData?.data ?? [];
  const timeSeries = aggregateDailyByDate(dailyRows);
  const hasTimeData = timeSeries.some((d) => d.views > 0);

  const totalViews = timeSeries.reduce((s, d) => s + d.views, 0);
  const totalWatchMinutes = timeSeries.reduce((s, d) => s + d.watchMinutes, 0);
  const totalLikes = timeSeries.reduce((s, d) => s + d.likes, 0);
  const totalComments = timeSeries.reduce((s, d) => s + d.comments, 0);

  const trafficRows = trafficData?.data ?? [];
  const trafficAgg = aggregateTraffic(trafficRows);
  const hasTrafficData = trafficAgg.length > 0;

  const ageRows = ageData?.data ?? [];
  const ageAgg = aggregateDemoPct(ageRows);
  const hasAgeData = ageAgg.length > 0;

  const genderRows = genderData?.data ?? [];
  const genderAgg = aggregateDemoPct(genderRows);
  const hasGenderData = genderAgg.length > 0;

  const countryRows = countryData?.data ?? [];
  const countryAgg = aggregateDemoCounts(countryRows, 10);
  const hasCountryData = countryAgg.length > 0;

  const snapshots = (snapshotsData?.snapshots ?? [])
    .map((s) => ({
      date: s.snapshot_date.slice(5),
      subscribers: s.subscriber_count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">分析</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {syncing ? '同期中...' : '同期'}
          </button>
          <div className="flex gap-1 rounded-lg bg-gray-800 p-1">
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === p.key
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {syncMessage && (
        <div className={`rounded-lg p-3 text-sm ${syncMessage.includes('失敗') ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>
          {syncMessage}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="再生回数" value={dLoading ? '...' : formatNumber(totalViews)} />
        <Card title="視聴時間 (分)" value={dLoading ? '...' : formatNumber(totalWatchMinutes)} />
        <Card title="いいね数" value={dLoading ? '...' : formatNumber(totalLikes)} />
        <Card title="コメント数" value={dLoading ? '...' : formatNumber(totalComments)} />
      </div>

      {/* Row 1: Views + Watch Time */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">再生回数の推移</h3>
          {dLoading ? (
            <NoDataMessage message="読み込み中..." />
          ) : !hasTimeData ? (
            <NoDataMessage message="データを同期してください" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: COLORS.tooltipBg, border: `1px solid ${COLORS.grid}`, borderRadius: '8px' }}
                  labelStyle={{ color: '#d1d5db' }}
                  itemStyle={{ color: '#d1d5db' }}
                />
                <Line type="monotone" dataKey="views" stroke={COLORS.primary} strokeWidth={2} dot={false} name="再生回数" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">視聴時間の推移</h3>
          {dLoading ? (
            <NoDataMessage message="読み込み中..." />
          ) : !hasTimeData ? (
            <NoDataMessage message="データを同期してください" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: COLORS.tooltipBg, border: `1px solid ${COLORS.grid}`, borderRadius: '8px' }}
                  labelStyle={{ color: '#d1d5db' }}
                  itemStyle={{ color: '#d1d5db' }}
                />
                <Line type="monotone" dataKey="watchMinutes" stroke={COLORS.secondary} strokeWidth={2} dot={false} name="視聴時間 (分)" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2: Subscribers + Traffic Sources */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">登録者数の推移</h3>
          {sLoading ? (
            <NoDataMessage message="読み込み中..." />
          ) : snapshots.length === 0 ? (
            <NoDataMessage message="データを同期してください" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={snapshots}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: COLORS.tooltipBg, border: `1px solid ${COLORS.grid}`, borderRadius: '8px' }}
                  labelStyle={{ color: '#d1d5db' }}
                  itemStyle={{ color: '#d1d5db' }}
                />
                <Line type="monotone" dataKey="subscribers" stroke={COLORS.primary} strokeWidth={2} dot={false} name="登録者数" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">トラフィックソース</h3>
          {tLoading ? (
            <NoDataMessage message="読み込み中..." />
          ) : !hasTrafficData ? (
            <NoDataMessage message="データを同期してください" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trafficAgg} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis dataKey="traffic_type" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: COLORS.tooltipBg, border: `1px solid ${COLORS.grid}`, borderRadius: '8px' }}
                  labelStyle={{ color: '#d1d5db' }}
                  itemStyle={{ color: '#d1d5db' }}
                />
                <Bar dataKey="views" name="再生回数">
                  {trafficAgg.map((entry, idx) => (
                    <Cell key={idx} fill={TRAFFIC_COLORS[entry.traffic_type] || TRAFFIC_COLORS.OTHER} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3: Demographics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Age Group - Horizontal Bar */}
        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">年齢層</h3>
          {ageLoading ? (
            <NoDataMessage message="読み込み中..." />
          ) : !hasAgeData ? (
            <NoDataMessage message="データを同期してください" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ageAgg} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} unit="%" />
                <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} width={70} />
                <Tooltip
                  contentStyle={{ backgroundColor: COLORS.tooltipBg, border: `1px solid ${COLORS.grid}`, borderRadius: '8px' }}
                  labelStyle={{ color: '#d1d5db' }}
                  itemStyle={{ color: '#d1d5db' }}
                  formatter={(value: unknown) => [`${value}%`, '割合']}
                />
                <Bar dataKey="percentage" fill={COLORS.primary} name="割合" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gender - Donut PieChart */}
        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">性別</h3>
          {genderLoading ? (
            <NoDataMessage message="読み込み中..." />
          ) : !hasGenderData ? (
            <NoDataMessage message="データを同期してください" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={genderAgg}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="percentage"
                  nameKey="name"
                  label={({ name, payload }) => `${name}: ${(payload as { percentage?: number })?.percentage ?? 0}%`}
                  labelLine={false}
                >
                  {genderAgg.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: COLORS.tooltipBg, border: `1px solid ${COLORS.grid}`, borderRadius: '8px' }}
                  itemStyle={{ color: '#d1d5db' }}
                  formatter={(value: unknown) => [`${value}%`, '割合']}
                />
                <Legend wrapperStyle={{ color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Country - Bar Chart top 10 */}
        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">国別 (Top 10)</h3>
          {countryLoading ? (
            <NoDataMessage message="読み込み中..." />
          ) : !hasCountryData ? (
            <NoDataMessage message="データを同期してください" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={countryAgg} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} width={40} />
                <Tooltip
                  contentStyle={{ backgroundColor: COLORS.tooltipBg, border: `1px solid ${COLORS.grid}`, borderRadius: '8px' }}
                  labelStyle={{ color: '#d1d5db' }}
                  itemStyle={{ color: '#d1d5db' }}
                />
                <Bar dataKey="views" fill={COLORS.accent} name="再生回数" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
