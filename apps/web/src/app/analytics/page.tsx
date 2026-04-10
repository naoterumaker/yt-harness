'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';

const periods = [
  { key: '7d', label: '過去7日間' },
  { key: '28d', label: '過去28日間' },
  { key: '90d', label: '過去90日間' },
  { key: '365d', label: '過去1年間' },
] as const;

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<string>('28d');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">分析</h1>
        <div className="flex gap-1 rounded-lg bg-gray-800 p-1">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p.key
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="再生回数" value="15.3K" subtitle="前期間比 +12%" />
        <Card title="視聴時間（時間）" value="4,200" subtitle="前期間比 +8%" />
        <Card title="新規登録者" value="320" subtitle="前期間比 +15%" />
        <Card title="収益" value="$1,240" subtitle="前期間比 +5%" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">再生回数の推移</h3>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-500">
            グラフプレースホルダー — チャートライブラリと連携予定
          </div>
        </div>

        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">視聴時間の推移</h3>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-500">
            グラフプレースホルダー — チャートライブラリと連携予定
          </div>
        </div>

        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">登録者数の推移</h3>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-500">
            グラフプレースホルダー — チャートライブラリと連携予定
          </div>
        </div>

        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">人気の動画</h3>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-500">
            グラフプレースホルダー — チャートライブラリと連携予定
          </div>
        </div>
      </div>
    </div>
  );
}
