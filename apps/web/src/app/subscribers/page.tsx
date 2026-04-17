'use client';

import { useMemo } from 'react';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useChannel } from '@/lib/channel-context';
import { useApi } from '@/lib/use-api';
import { fetchSubscribers, type Subscriber } from '@/lib/api';

export default function SubscribersPage() {
  const { selected, loading: chLoading, error: chError } = useChannel();

  const fetcher = useMemo(
    () => (selected ? () => fetchSubscribers(selected.id) : null),
    [selected],
  );
  const { data, loading, error } = useApi<{ subscribers: Subscriber[] }>(fetcher);

  if (chLoading || loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">読み込み中...</div>;
  }
  if (chError || error) {
    return <div className="rounded-lg bg-red-900/30 p-4 text-red-300">{chError || error}</div>;
  }
  if (!selected) {
    return <div className="text-gray-400">チャンネルが登録されていません。</div>;
  }

  const subscribers = data?.subscribers ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">登録者</h1>

      {subscribers.length === 0 ? (
        <div className="rounded-lg bg-gray-800 p-8 text-center text-gray-500">登録者がいません</div>
      ) : (
        <div className="rounded-lg bg-gray-800">
          <Table
            headers={['アバター', '名前', '登録日', 'ステータス']}
            rows={subscribers.map((s) => [
              s.profile_image_url ? (
                <img
                  key="av"
                  src={s.profile_image_url}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div key="av" className="h-8 w-8 rounded-full bg-gray-600" />
              ),
              s.display_name,
              s.subscribed_at ? new Date(s.subscribed_at).toLocaleDateString('ja-JP') : '—',
              <Badge key="st" variant={s.is_active ? 'success' : 'warning'}>
                {s.is_active ? 'アクティブ' : '非アクティブ'}
              </Badge>,
            ])}
          />
        </div>
      )}
    </div>
  );
}
