'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { useChannel } from '@/lib/channel-context';
import { useApi } from '@/lib/use-api';
import { fetchAnalytics, fetchVideos, type Video } from '@/lib/api';
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

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<string>('28d');
  const { selected, loading: chLoading, error: chError } = useChannel();

  const selectedPeriod = periods.find((p) => p.key === period) ?? periods[1];
  const startDate = daysAgo(selectedPeriod.days);
  const endDate = new Date().toISOString().slice(0, 10);

  const analyticsFetcher = useMemo(
    () => (selected ? () => fetchAnalytics(selected.id, startDate, endDate) : null),
    [selected, startDate, endDate],
  );
  const videosFetcher = useMemo(
    () => (selected ? () => fetchVideos(selected.id) : null),
    [selected],
  );

  const { data: analyticsData, loading: aLoading, error: aError } = useApi<{ analytics: unknown }>(analyticsFetcher);
  const { data: videosData, loading: vLoading } = useApi<{ videos: Video[] }>(videosFetcher);

  if (chLoading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">読み込み中...</div>;
  }
  if (chError) {
    return <div className="rounded-lg bg-red-900/30 p-4 text-red-300">{chError}</div>;
  }
  if (!selected) {
    return <div className="text-gray-400">チャンネルが登録されていません。</div>;
  }

  const videos = videosData?.videos ?? [];
  const totalViews = videos.reduce((sum, v) => sum + v.view_count, 0);
  const totalLikes = videos.reduce((sum, v) => sum + v.like_count, 0);
  const totalComments = videos.reduce((sum, v) => sum + v.comment_count, 0);

  // Analytics data from YouTube Analytics API (may be unavailable)
  const analyticsAvailable = analyticsData?.analytics && !aError;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">分析</h1>
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

      {aError && (
        <div className="rounded-lg bg-yellow-900/30 p-3 text-sm text-yellow-300">
          YouTube Analytics APIからのデータ取得に失敗しました。ローカルデータを表示しています。
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="総再生回数" value={vLoading ? '...' : formatNumber(totalViews)} />
        <Card title="総いいね数" value={vLoading ? '...' : formatNumber(totalLikes)} />
        <Card title="総コメント数" value={vLoading ? '...' : formatNumber(totalComments)} />
        <Card title="動画数" value={vLoading ? '...' : videos.length.toString()} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">再生回数の推移</h3>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-500">
            {aLoading ? '読み込み中...' : analyticsAvailable ? 'Analytics APIデータあり — チャートライブラリと連携予定' : 'グラフプレースホルダー — チャートライブラリと連携予定'}
          </div>
        </div>

        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">視聴時間の推移</h3>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-500">
            {aLoading ? '読み込み中...' : 'グラフプレースホルダー — チャートライブラリと連携予定'}
          </div>
        </div>

        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">登録者数の推移</h3>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-500">
            グラフプレースホルダー — チャートライブラリと連携予定
          </div>
        </div>

        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">人気の動画</h3>
          {vLoading ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400">読み込み中...</div>
          ) : videos.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-500">データなし</div>
          ) : (
            <div className="space-y-2">
              {[...videos]
                .sort((a, b) => b.view_count - a.view_count)
                .slice(0, 5)
                .map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-sm">
                    <span className="truncate text-gray-300">{v.title}</span>
                    <span className="ml-2 shrink-0 text-gray-400">{formatNumber(v.view_count)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
