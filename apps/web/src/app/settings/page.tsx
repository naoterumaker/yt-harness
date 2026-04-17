'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useChannel } from '@/lib/channel-context';
import { apiFetch } from '@/lib/api';

export default function SettingsPage() {
  const { channels, selected, loading: chLoading, error: chError, refresh } = useChannel();
  const [threshold, setThreshold] = useState(80);
  const [quotaLimit, setQuotaLimit] = useState(10000);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/auth/url')
      .then((data) => setAuthUrl((data as { url: string }).url))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selected) {
      setThreshold(selected.quota_alert_threshold);
      setQuotaLimit(selected.daily_quota_limit);
    }
  }, [selected]);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiFetch(`/api/channels/${selected.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          daily_quota_limit: quotaLimit,
          quota_alert_threshold: threshold,
        }),
      });
      setSaveMsg('保存しました');
      refresh();
    } catch {
      setSaveMsg('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // OAuth callback から戻ってきた場合
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const added = params.get('added');
    if (added) {
      setSaveMsg(`「${added}」を追加しました`);
      refresh();
      window.history.replaceState({}, '', '/settings');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (chLoading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">読み込み中...</div>;
  }
  if (chError) {
    return <div className="rounded-lg bg-red-900/30 p-4 text-red-300">{chError}</div>;
  }
  if (!selected) {
    return <div className="text-gray-400">チャンネルが登録されていません。</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      <div className="max-w-xl space-y-6">
        {/* 登録済みチャンネル一覧 */}
        <div className="rounded-lg bg-gray-800 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-gray-200">登録済みチャンネル ({channels.length})</h3>
            {authUrl && (
              <a
                href={authUrl}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                + チャンネル追加
              </a>
            )}
          </div>
          <div className="space-y-3">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  ch.id === selected?.id
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-700 bg-gray-900'
                }`}
              >
                {ch.channel_thumbnail && (
                  <img
                    src={ch.channel_thumbnail}
                    alt={ch.channel_title}
                    className="h-10 w-10 rounded-full"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-200 truncate">{ch.channel_title}</div>
                  <div className="text-xs text-gray-500 font-mono">{ch.channel_id}</div>
                </div>
                {ch.id === selected?.id && (
                  <span className="text-xs text-blue-400">選択中</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 選択中のチャンネル情報 */}
        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-4 font-medium text-gray-200">チャンネル詳細</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">チャンネル名</span>
              <span className="text-gray-200">{selected.channel_title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">チャンネルID</span>
              <span className="font-mono text-gray-200">{selected.channel_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">内部ID</span>
              <span className="font-mono text-gray-200">{selected.id}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-4 font-medium text-gray-200">API設定</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Worker URL</label>
              <input
                type="text"
                defaultValue={process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787'}
                readOnly
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">環境変数 NEXT_PUBLIC_API_URL で変更</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-4 font-medium text-gray-200">クォータ設定</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">1日のクォータ上限</label>
              <input
                type="number"
                min={1000}
                max={100000}
                step={1000}
                value={quotaLimit}
                onChange={(e) => setQuotaLimit(Number(e.target.value))}
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">
                アラート閾値: {threshold}%
              </label>
              <input
                type="range"
                min={50}
                max={95}
                step={5}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>50%</span>
                <span>95%</span>
              </div>
            </div>
          </div>
        </div>

        {saveMsg && (
          <div className={`rounded-lg p-3 text-sm ${saveMsg.includes('失敗') ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>
            {saveMsg}
          </div>
        )}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '設定を保存'}
        </Button>
      </div>
    </div>
  );
}
