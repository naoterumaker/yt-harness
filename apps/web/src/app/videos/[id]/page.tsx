'use client';

import { useMemo, use } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChannel } from '@/lib/channel-context';
import { useApi } from '@/lib/use-api';
import { fetchVideo, fetchVideoSnapshots, type Video, type VideoMetricsSnapshot } from '@/lib/api';
import { formatNumber, formatDate } from '@/lib/utils';

interface Props {
  params: Promise<{ id: string }>;
}

const statusVariant: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  public: 'success',
  private: 'warning',
  unlisted: 'info',
  scheduled: 'default',
};

const statusLabel: Record<string, string> = {
  public: '公開',
  private: '非公開',
  unlisted: '限定公開',
  scheduled: 'スケジュール済',
};

export default function VideoDetailPage({ params }: Props) {
  const { id } = use(params);
  const videoId = Number(id);
  const { selected, loading: chLoading, error: chError } = useChannel();

  const fetcher = useMemo(
    () => (selected ? () => fetchVideo(selected.id, videoId) : null),
    [selected, videoId],
  );
  const { data, loading, error } = useApi<{ video: Video }>(fetcher);

  const video = data?.video;

  const snapshotsFetcher = useMemo(
    () => (selected && video ? () => fetchVideoSnapshots(selected.id, video.video_id) : null),
    [selected, video],
  );
  const { data: snapshotsData, loading: snapLoading } = useApi<{ snapshots: VideoMetricsSnapshot[] }>(snapshotsFetcher);

  if (chLoading || loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">読み込み中...</div>;
  }
  if (chError || error) {
    return <div className="rounded-lg bg-red-900/30 p-4 text-red-300">{chError || error}</div>;
  }
  if (!selected) {
    return <div className="text-gray-400">チャンネルが登録されていません。</div>;
  }

  if (!video) {
    return <div className="rounded-lg bg-gray-800 p-8 text-center text-gray-500">動画が見つかりません (ID: {id})</div>;
  }

  const snapshots = (snapshotsData?.snapshots ?? [])
    .map((s) => ({
      date: s.snapshot_date.slice(5), // MM-DD
      views: s.view_count,
      likes: s.like_count,
      comments: s.comment_count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">動画詳細</h1>
        <Badge variant={statusVariant[video.status] ?? 'default'}>
          {statusLabel[video.status] ?? video.status}
        </Badge>
      </div>

      <div className="rounded-lg bg-gray-800 p-5">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="mb-4 aspect-video w-full max-w-2xl rounded-lg object-cover"
          />
        ) : (
          <div className="mb-4 aspect-video w-full max-w-2xl rounded-lg bg-gray-700" />
        )}
        <h2 className="text-xl font-semibold">{video.title}</h2>
        <p className="mt-1 text-sm text-gray-400">
          動画ID: {video.video_id}
          {video.published_at && <> &middot; {formatDate(video.published_at)}</>}
        </p>
        {video.description && (
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">{video.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="再生回数" value={formatNumber(video.view_count)} />
        <Card title="高評価" value={formatNumber(video.like_count)} />
        <Card title="コメント数" value={formatNumber(video.comment_count)} />
      </div>

      {/* Analytics chart */}
      <div className="rounded-lg bg-gray-800 p-5">
        <h3 className="mb-3 font-medium text-gray-200">メトリクス推移（直近30日）</h3>
        {snapLoading ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-400">読み込み中...</div>
        ) : snapshots.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-500">
            スナップショットデータがありません
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={snapshots}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#d1d5db' }}
                itemStyle={{ color: '#d1d5db' }}
              />
              <Legend wrapperStyle={{ color: '#d1d5db' }} />
              <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={false} name="再生回数" />
              <Line type="monotone" dataKey="likes" stroke="#10b981" strokeWidth={2} dot={false} name="高評価" />
              <Line type="monotone" dataKey="comments" stroke="#f59e0b" strokeWidth={2} dot={false} name="コメント" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
