'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { QuotaGauge } from '@/components/quota-gauge';
import { useChannel } from '@/lib/channel-context';
import { useApi } from '@/lib/use-api';
import { fetchVideos, fetchComments, fetchUsage, type Video, type Comment, type UsageData } from '@/lib/api';
import { formatNumber } from '@/lib/utils';

function statusLabel(s: string) {
  switch (s) {
    case 'public': return '公開';
    case 'private': return '非公開';
    case 'unlisted': return '限定公開';
    case 'scheduled': return '予約済み';
    default: return s;
  }
}

function statusVariant(s: string): 'success' | 'warning' | 'info' | 'danger' {
  switch (s) {
    case 'public': return 'success';
    case 'scheduled': return 'info';
    default: return 'warning';
  }
}

export default function DashboardPage() {
  const { selected, loading: chLoading, error: chError } = useChannel();

  const videosFetcher = useMemo(
    () => (selected ? () => fetchVideos(selected.id) : null),
    [selected],
  );
  const commentsFetcher = useMemo(
    () => (selected ? () => fetchComments(selected.id) : null),
    [selected],
  );
  const usageFetcher = useMemo(
    () => (selected ? () => fetchUsage(selected.id) : null),
    [selected],
  );

  const { data: videosData, loading: vLoading, error: vError } = useApi<{ videos: Video[] }>(videosFetcher);
  const { data: commentsData, loading: cLoading, error: cError } = useApi<{ comments: Comment[] }>(commentsFetcher);
  const { data: usage, loading: uLoading } = useApi<UsageData>(usageFetcher);

  if (chLoading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">読み込み中...</div>;
  }
  if (chError) {
    return <div className="rounded-lg bg-red-900/30 p-4 text-red-300">{chError}</div>;
  }
  if (!selected) {
    return <div className="text-gray-400">チャンネルが登録されていません。設定からチャンネルを追加してください。</div>;
  }

  const anyError = vError || cError;

  const videos = videosData?.videos ?? [];
  const comments = commentsData?.comments ?? [];
  const recentVideos = videos.slice(0, 4);
  const recentComments = comments.slice(0, 5);

  const totalViews = videos.reduce((sum, v) => sum + v.view_count, 0);
  const pendingComments = comments.length; // all comments count as proxy
  const publicVideos = videos.filter((v) => v.status === 'public').length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      {anyError && (
        <div className="rounded-lg bg-red-900/30 p-4 text-red-300">{anyError}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          title="チャンネル名"
          value={selected.channel_title}
          subtitle={`ID: ${selected.channel_id}`}
        />
        <Card
          title="総再生回数"
          value={vLoading ? '...' : formatNumber(totalViews)}
          subtitle={`${publicVideos}本の公開動画`}
        />
        <Card
          title="動画数"
          value={vLoading ? '...' : videos.length.toString()}
        />
        <Card
          title="コメント数"
          value={cLoading ? '...' : comments.length.toString()}
        />
      </div>

      <div className="rounded-lg bg-gray-800 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-gray-200">APIクォータ</h3>
          <span className="text-xs text-gray-400">太平洋時間の深夜にリセット</span>
        </div>
        {uLoading ? (
          <div className="text-sm text-gray-400">読み込み中...</div>
        ) : (
          <QuotaGauge used={usage?.daily_used ?? 0} limit={usage?.daily_limit ?? 10000} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">最近の動画</h3>
          {vLoading ? (
            <div className="py-4 text-sm text-gray-400">読み込み中...</div>
          ) : recentVideos.length === 0 ? (
            <div className="py-4 text-sm text-gray-500">動画がありません</div>
          ) : (
            <Table
              headers={['タイトル', 'ステータス', '再生回数', '公開日']}
              rows={recentVideos.map((v) => [
                v.title,
                <Badge key="s" variant={statusVariant(v.status)}>
                  {statusLabel(v.status)}
                </Badge>,
                formatNumber(v.view_count),
                v.published_at ? new Date(v.published_at).toLocaleDateString('ja-JP') : '—',
              ])}
            />
          )}
        </div>

        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">最近のコメント</h3>
          {cLoading ? (
            <div className="py-4 text-sm text-gray-400">読み込み中...</div>
          ) : recentComments.length === 0 ? (
            <div className="py-4 text-sm text-gray-500">コメントがありません</div>
          ) : (
            <Table
              headers={['コメント', '投稿者', '動画ID']}
              rows={recentComments.map((c) => [
                c.text,
                c.author_display_name,
                c.video_id,
              ])}
            />
          )}
        </div>
      </div>
    </div>
  );
}
