'use client';

import { useMemo } from 'react';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useChannel } from '@/lib/channel-context';
import { useApi } from '@/lib/use-api';
import { fetchGates, type CommentGate } from '@/lib/api';

function triggerLabel(t: string) {
  switch (t) {
    case 'comment': return '全コメント';
    case 'comment_keyword': return 'キーワード';
    case 'subscribe': return '新規登録者';
    case 'like': return 'いいね';
    default: return t;
  }
}

function actionLabel(a: string) {
  switch (a) {
    case 'reply': return '返信';
    case 'pin_comment': return 'ピン留め';
    case 'verify_only': return '検証のみ';
    default: return a;
  }
}

export default function GatesPage() {
  const { selected, loading: chLoading, error: chError } = useChannel();

  const fetcher = useMemo(
    () => (selected ? () => fetchGates(selected.id) : null),
    [selected],
  );
  const { data, loading, error } = useApi<{ gates: CommentGate[] }>(fetcher);

  if (chLoading || loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">読み込み中...</div>;
  }
  if (chError || error) {
    return <div className="rounded-lg bg-red-900/30 p-4 text-red-300">{chError || error}</div>;
  }
  if (!selected) {
    return <div className="text-gray-400">チャンネルが登録されていません。</div>;
  }

  const gates = data?.gates ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">コメントゲート</h1>
        <Link href="/gates/new">
          <Button>新規ゲート</Button>
        </Link>
      </div>

      {gates.length === 0 ? (
        <div className="rounded-lg bg-gray-800 p-8 text-center text-gray-500">ゲートがありません</div>
      ) : (
        <div className="rounded-lg bg-gray-800">
          <Table
            headers={['名前', 'トリガー', 'アクション', 'ステータス', 'キーワード']}
            rows={gates.map((g) => [
              g.name,
              <Badge key="t" variant="info">{triggerLabel(g.trigger)}</Badge>,
              actionLabel(g.action),
              <Badge key="s" variant={g.is_active ? 'success' : 'warning'}>
                {g.is_active ? '有効' : '一時停止'}
              </Badge>,
              g.trigger_keyword ?? '—',
            ])}
          />
        </div>
      )}
    </div>
  );
}
