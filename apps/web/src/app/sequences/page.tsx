'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useChannel } from '@/lib/channel-context';
import { useApi } from '@/lib/use-api';
import { fetchSequences, type Sequence } from '@/lib/api';

export default function SequencesPage() {
  const { selected, loading: chLoading, error: chError } = useChannel();

  const fetcher = useMemo(
    () => (selected ? () => fetchSequences(selected.id) : null),
    [selected],
  );
  const { data, loading, error } = useApi<{ sequences: Sequence[] }>(fetcher);

  if (chLoading || loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">読み込み中...</div>;
  }
  if (chError || error) {
    return <div className="rounded-lg bg-red-900/30 p-4 text-red-300">{chError || error}</div>;
  }
  if (!selected) {
    return <div className="text-gray-400">チャンネルが登録されていません。</div>;
  }

  const sequences = data?.sequences ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">シーケンス</h1>
        <Link
          href="/sequences/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          新規作成
        </Link>
      </div>

      {sequences.length === 0 ? (
        <div className="rounded-lg bg-gray-800 p-8 text-center">
          <p className="text-gray-500">シーケンスがありません</p>
          <Link
            href="/sequences/new"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            新規作成
          </Link>
        </div>
      ) : (
        <div className="rounded-lg bg-gray-800">
          <Table
            headers={['名前', 'トリガー', 'ステータス']}
            rows={sequences.map((s) => [
              s.name,
              <Badge key="t" variant="info">{s.trigger}</Badge>,
              <Badge key="s" variant={s.is_active ? 'success' : 'warning'}>
                {s.is_active ? '有効' : '一時停止'}
              </Badge>,
            ])}
          />
        </div>
      )}
    </div>
  );
}
