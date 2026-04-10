'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function NewGatePage() {
  const [triggerType, setTriggerType] = useState('keyword');
  const [lotteryRate, setLotteryRate] = useState(10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create New Gate</h1>

      <form className="max-w-xl space-y-5 rounded-lg bg-gray-800 p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Gate Name
          </label>
          <input
            type="text"
            placeholder="e.g. Free PDF Gate"
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Trigger Type
          </label>
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="keyword">Keyword Match</option>
            <option value="any_comment">Any Comment</option>
            <option value="new_subscriber">New Subscriber</option>
          </select>
        </div>

        {triggerType === 'keyword' && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Keywords (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. free, pdf, download"
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Action Type
          </label>
          <select className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none">
            <option value="reply">Reply to Comment</option>
            <option value="dm">DM Link</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Reply Template
          </label>
          <textarea
            rows={4}
            placeholder="Thanks for commenting! Here is your link: {{link}}"
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Lottery Rate: {lotteryRate}%
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
          <Button type="submit">Create Gate</Button>
          <Button variant="secondary" type="button">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
