'use client';

import { useMemo } from 'react';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useChannel } from '@/lib/channel-context';
import { useApi } from '@/lib/use-api';
import { fetchVideos, type Video } from '@/lib/api';
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

export default function VideosPage() {
  const { selected, loading: chLoading, error: chError } = useChannel();

  const fetcher = useMemo(
    () => (selected ? () => fetchVideos(selected.id) : null),
    [selected],
  );
  const { data, loading, error } = useApi<{ videos: Video[] }>(fetcher);

  if (chLoading || loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">読み込み中...</div>;
  }
  if (chError || error) {
    return <div className="rounded-lg bg-red-900/30 p-4 text-red-300">{chError || error}</div>;
  }
  if (!selected) {
    return <div className="text-gray-400">チャンネルが登録されていません。</div>;
  }

  const videos = data?.videos ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">動画</h1>
      </div>

      {videos.length === 0 ? (
        <div className="rounded-lg bg-gray-800 p-8 text-center text-gray-500">動画がありません</div>
      ) : (
        <div className="rounded-lg bg-gray-800">
          <Table
            headers={['サムネイル', 'タイトル', 'ステータス', '再生回数', '公開日']}
            rows={videos.map((v) => [
              v.thumbnail_url ? (
                <img
                  key="thumb"
                  src={v.thumbnail_url}
                  alt=""
                  className="h-10 w-16 rounded object-cover"
                />
              ) : (
                <div key="thumb" className="h-10 w-16 rounded bg-gray-700" />
              ),
              <Link key="title" href={`/videos/${v.id}`} className="text-blue-400 hover:underline">
                {v.title}
              </Link>,
              <Badge
                key="s"
                variant={statusVariant(v.status)}
              >
                {statusLabel(v.status)}
              </Badge>,
              formatNumber(v.view_count),
              v.published_at ? new Date(v.published_at).toLocaleDateString('ja-JP') : '—',
            ])}
          />
        </div>
      )}
    </div>
  );
}
