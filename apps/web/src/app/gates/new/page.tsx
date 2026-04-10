'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function NewGatePage() {
  const [triggerType, setTriggerType] = useState('keyword');
  const [lotteryRate, setLotteryRate] = useState(10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">新規ゲート作成</h1>

      <form className="max-w-xl space-y-5 rounded-lg bg-gray-800 p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            ゲート名
          </label>
          <input
            type="text"
            placeholder="例: 無料PDFゲート"
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            トリガータイプ
          </label>
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="keyword">キーワード一致</option>
            <option value="any_comment">全コメント</option>
            <option value="new_subscriber">新規登録者</option>
          </select>
        </div>

        {triggerType === 'keyword' && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              キーワード（カンマ区切り）
            </label>
            <input
              type="text"
              placeholder="例: 無料, PDF, ダウンロード"
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            アクションタイプ
          </label>
          <select className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none">
            <option value="reply">コメントに返信</option>
            <option value="dm">DMリンク</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            返信テンプレート
          </label>
          <textarea
            rows={4}
            placeholder="コメントありがとうございます！こちらがリンクです: {{link}}"
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            当選確率: {lotteryRate}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={lotteryRate}
            onChange={(e) => setLotteryRate(Number(e.target.value))}
            className="w-full"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit">ゲートを作成</Button>
          <Button variant="secondary" type="button">
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  );
}
