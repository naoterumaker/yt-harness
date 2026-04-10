'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const [threshold, setThreshold] = useState(80);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      <div className="max-w-xl space-y-6">
        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-4 font-medium text-gray-200">チャンネル情報</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">チャンネル名</span>
              <span className="text-gray-200">メインチャンネル</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">チャンネルID</span>
              <span className="font-mono text-gray-200">UC1234567890abcdef</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">登録者数</span>
              <span className="text-gray-200">24,500</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-4 font-medium text-gray-200">API設定</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">APIキー</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value="AIzaSy••••••••••••••••••••"
                  readOnly
                  className="flex-1 rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:outline-none"
                />
                <Button variant="secondary">表示</Button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Worker URL</label>
              <input
                type="text"
                defaultValue="https://yt-harness.workers.dev"
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-4 font-medium text-gray-200">クォータアラート</h3>
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

        <Button>設定を保存</Button>
      </div>
    </div>
  );
}
