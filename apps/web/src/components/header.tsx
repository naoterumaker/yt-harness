'use client';

import { useCallback, useMemo } from 'react';
import { QuotaGauge } from './quota-gauge';
import { useChannel } from '@/lib/channel-context';
import { fetchUsage, type UsageData } from '@/lib/api';
import { useApi } from '@/lib/use-api';

export function Header() {
  const { channels, selected, setSelectedId, loading: channelLoading } = useChannel();

  const usageFetcher = useMemo(
    () => (selected ? () => fetchUsage(selected.id) : null),
    [selected],
  );
  const { data: usage } = useApi<UsageData>(usageFetcher);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedId(Number(e.target.value));
    },
    [setSelectedId],
  );

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-800 bg-gray-900 px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-gray-300">チャンネルを選択:</h2>
        {channelLoading ? (
          <span className="text-sm text-gray-500">読み込み中...</span>
        ) : channels.length === 0 ? (
          <span className="text-sm text-gray-500">チャンネルなし</span>
        ) : (
          <select
            value={selected?.id ?? ''}
            onChange={handleChange}
            className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
          >
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.channel_title}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-400">クォータ</span>
        <QuotaGauge
          used={usage?.daily_used ?? 0}
          limit={usage?.daily_limit ?? 10000}
        />
      </div>
    </header>
  );
}
