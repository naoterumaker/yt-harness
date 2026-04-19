'use client';

import { useMemo, useState } from 'react';
import { Table } from '@/components/ui/table';
import { useChannel } from '@/lib/channel-context';
import { useApi } from '@/lib/use-api';
import { fetchPlaylists, syncPlaylists, type Playlist } from '@/lib/api';
import { showToast } from '@/components/ui/toast';

export default function PlaylistsPage() {
  const { selected, loading: chLoading, error: chError } = useChannel();
  const [syncing, setSyncing] = useState(false);

  const fetcher = useMemo(
    () => (selected ? () => fetchPlaylists(selected.id) : null),
    [selected],
  );
  const { data, loading, error, refresh } = useApi<{ playlists: Playlist[] }>(fetcher);

  const handleSync = async () => {
    if (!selected || syncing) return;
    setSyncing(true);
    try {
      await syncPlaylists(selected.id);
      showToast('プレイリストを同期しました', 'success');
      refresh();
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

  const playlists = data?.playlists ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">プレイリスト</h1>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {syncing ? '同期中...' : '同期'}
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="rounded-lg bg-gray-800 p-8 text-center">
          <p className="text-gray-500">プレイリストがありません</p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            YouTubeから同期
          </button>
        </div>
      ) : (
        <div className="rounded-lg bg-gray-800">
          <Table
            headers={['タイトル', '動画数', '最終更新']}
            rows={playlists.map((p) => [
              p.title,
              p.video_count,
              new Date(p.updated_at).toLocaleDateString('ja-JP'),
            ])}
          />
        </div>
      )}
    </div>
  );
}
