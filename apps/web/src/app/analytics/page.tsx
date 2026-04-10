'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';

const periods = ['7d', '28d', '90d', '365d'] as const;

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<string>('28d');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-1 rounded-lg bg-gray-800 p-1">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Views" value="15.3K" subtitle="+12% vs previous period" />
        <Card title="Watch Time (hours)" value="4,200" subtitle="+8% vs previous period" />
        <Card title="Subscribers Gained" value="320" subtitle="+15% vs previous period" />
        <Card title="Revenue" value="$1,240" subtitle="+5% vs previous period" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">Views Over Time</h3>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-500">
            Chart placeholder — integrate with charting library
          </div>
        </div>

        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">Watch Time Over Time</h3>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-500">
            Chart placeholder — integrate with charting library
          </div>
        </div>

        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">Subscriber Growth</h3>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-500">
            Chart placeholder — integrate with charting library
          </div>
        </div>

        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">Top Videos</h3>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-500">
            Chart placeholder — integrate with charting library
          </div>
        </div>
      </div>
    </div>
  );
}
