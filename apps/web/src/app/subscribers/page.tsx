'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useChannel } from '@/lib/channel-context';
import { useApi } from '@/lib/use-api';
import {
  fetchSubscribers,
  fetchSubscriberSnapshots,
  syncSubscribers,
  type Subscriber,
  type SubscriberSnapshot,
} from '@/lib/api';
import { showToast } from '@/components/ui/toast';

export default function SubscribersPage() {
  const { selected, loading: chLoading, error: chError } = useChannel();
  const [syncing, setSyncing] = useState(false);

  const fetcher = useMemo(
    () => (selected ? () => fetchSubscribers(selected.id) : null),
    [selected],
  );
  const snapshotsFetcher = useMemo(
    () => (selected ? () => fetchSubscriberSnapshots(selected.id) : null),
    [selected],
  );

  const { data, loading, error, refresh } = useApi<{ subscribers: Subscriber[] }>(fetcher);
  const { data: snapshotsData, loading: sLoading, refresh: refreshSnapshots } = useApi<{ snapshots: SubscriberSnapshot[] }>(snapshotsFetcher);

  const handleSync = async () => {
    if (!selected || syncing) return;
    setSyncing(true);
    try {
      await syncSubscribers(selected.id);
      showToast('登録者を同期しました', 'success');
      refresh();
      refreshSnapshots();
    } catch {
      showToast('同期に失敗しました', 'error');
    } finally {
      setSyncing(false);
    }
  };

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
  const snapshots = (snapshotsData?.snapshots ?? [])
    .map((s) => ({
      date: s.snapshot_date.slice(5),
      subscribers: s.subscriber_count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">登録者</h1>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {syncing ? '同期中...' : '同期'}
        </button>
      </div>

      {/* Subscriber snapshots chart */}
      <div className="rounded-lg bg-gray-800 p-5">
        <h3 className="mb-3 font-medium text-gray-200">登録者数の推移</h3>
        {sLoading ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-400">読み込み中...</div>
        ) : snapshots.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-500">
            スナップショットデータがありません。同期してください。
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={192}>
            <LineChart data={snapshots}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#d1d5db' }}
                itemStyle={{ color: '#d1d5db' }}
              />
              <Line type="monotone" dataKey="subscribers" stroke="#3b82f6" strokeWidth={2} dot={false} name="登録者数" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

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
