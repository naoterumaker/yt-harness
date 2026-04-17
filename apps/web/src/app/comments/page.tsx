'use client';

import { useMemo } from 'react';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useChannel } from '@/lib/channel-context';
import { useApi } from '@/lib/use-api';
import { fetchComments, type Comment } from '@/lib/api';

export default function CommentsPage() {
  const { selected, loading: chLoading, error: chError } = useChannel();

  const fetcher = useMemo(
    () => (selected ? () => fetchComments(selected.id) : null),
    [selected],
  );
  const { data, loading, error } = useApi<{ comments: Comment[] }>(fetcher);

  if (chLoading || loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">読み込み中...</div>;
  }
  if (chError || error) {
    return <div className="rounded-lg bg-red-900/30 p-4 text-red-300">{chError || error}</div>;
  }
  if (!selected) {
    return <div className="text-gray-400">チャンネルが登録されていません。</div>;
  }

  const comments = data?.comments ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">コメント</h1>

      {comments.length === 0 ? (
        <div className="rounded-lg bg-gray-800 p-8 text-center text-gray-500">コメントがありません</div>
      ) : (
        <div className="rounded-lg bg-gray-800">
          <Table
            headers={['コメント', '動画ID', '投稿者', 'ピン留め']}
            rows={comments.map((c) => [
              <span key="t" className="line-clamp-1 max-w-xs">{c.text}</span>,
              c.video_id,
              c.author_display_name,
              <Badge
                key="s"
                variant={c.is_pinned ? 'success' : 'info'}
              >
                {c.is_pinned ? 'ピン留め' : '—'}
              </Badge>,
            ])}
          />
        </div>
      )}
    </div>
  );
}
