'use client';

import { useMemo, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { useChannel } from '@/lib/channel-context';
import { useApi } from '@/lib/use-api';
import { fetchComments, moderateComment, replyComment, type Comment } from '@/lib/api';

const PAGE_SIZE = 50;

export default function CommentsPage() {
  const { selected, loading: chLoading, error: chError } = useChannel();
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [moderating, setModerating] = useState<number | null>(null);

  const fetcher = useMemo(
    () =>
      selected
        ? () => fetchComments(selected.id, { offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE })
        : null,
    [selected, page],
  );
  const { data, loading, error, refresh } = useApi<{ comments: Comment[]; total: number }>(fetcher);

  const comments = data?.comments ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleModerate = useCallback(
    async (commentId: number, status: 'approved' | 'held' | 'rejected') => {
      if (!selected) return;
      setModerating(commentId);
      try {
        await moderateComment(selected.id, commentId, status);
        refresh();
      } catch {
        // エラーは無視（UIにフィードバックを追加する場合はここで処理）
      } finally {
        setModerating(null);
      }
    },
    [selected, refresh],
  );

  const handleReply = useCallback(
    async (comment: Comment) => {
      if (!selected || !replyText.trim()) return;
      try {
        await replyComment(selected.id, {
          video_id: comment.video_id,
          comment_id: `reply-${Date.now()}`,
          parent_comment_id: comment.comment_id,
          author_channel_id: selected.channel_id,
          author_display_name: selected.channel_title,
          text: replyText.trim(),
          like_count: 0,
          is_pinned: false,
          published_at: new Date().toISOString(),
        });
        setReplyText('');
        setReplyingId(null);
        refresh();
      } catch {
        // エラー処理
      }
    },
    [selected, replyText, refresh],
  );

  if (chLoading || loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">読み込み中...</div>;
  }
  if (chError || error) {
    return <div className="rounded-lg bg-red-900/30 p-4 text-red-300">{chError || error}</div>;
  }
  if (!selected) {
    return <div className="text-gray-400">チャンネルが登録されていません。</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">コメント</h1>
        <span className="text-sm text-gray-400">{total}件</span>
      </div>

      {comments.length === 0 ? (
        <div className="rounded-lg bg-gray-800 p-8 text-center text-gray-500">コメントがありません</div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg bg-gray-800 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-200">{c.author_display_name}</span>
                    <span className="text-gray-500">{c.video_id}</span>
                    {c.is_pinned && <Badge variant="success">ピン留め</Badge>}
                  </div>
                  <button
                    type="button"
                    className="mt-1 w-full text-left"
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  >
                    <p className={`text-sm text-gray-300 ${expandedId === c.id ? '' : 'line-clamp-2'}`}>
                      {c.text}
                    </p>
                    {c.text.length > 100 && (
                      <span className="text-xs text-blue-400">
                        {expandedId === c.id ? '折りたたむ' : '...続きを読む'}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Moderation buttons */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  className="px-2.5 py-1 text-xs"
                  disabled={moderating === c.id}
                  onClick={() => handleModerate(c.id, 'approved')}
                >
                  承認
                </Button>
                <Button
                  variant="secondary"
                  className="px-2.5 py-1 text-xs"
                  disabled={moderating === c.id}
                  onClick={() => handleModerate(c.id, 'held')}
                >
                  保留
                </Button>
                <Button
                  variant="danger"
                  className="px-2.5 py-1 text-xs"
                  disabled={moderating === c.id}
                  onClick={() => handleModerate(c.id, 'rejected')}
                >
                  拒否
                </Button>
                <Button
                  variant="secondary"
                  className="px-2.5 py-1 text-xs"
                  onClick={() => setReplyingId(replyingId === c.id ? null : c.id)}
                >
                  返信
                </Button>
              </div>

              {/* Reply textarea */}
              {replyingId === c.id && (
                <div className="mt-3 space-y-2">
                  <textarea
                    className="w-full rounded-lg border border-gray-600 bg-gray-900 p-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    rows={3}
                    placeholder="返信を入力..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      className="px-3 py-1 text-xs"
                      disabled={!replyText.trim()}
                      onClick={() => handleReply(c)}
                    >
                      送信
                    </Button>
                    <Button
                      variant="secondary"
                      className="px-3 py-1 text-xs"
                      onClick={() => { setReplyingId(null); setReplyText(''); }}
                    >
                      キャンセル
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
