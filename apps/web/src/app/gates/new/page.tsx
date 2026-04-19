'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useChannel } from '@/lib/channel-context';
import { createGate } from '@/lib/api';
import { interpolateTemplate } from '@/lib/utils';

interface FieldErrors {
  name?: string;
  trigger_keyword?: string;
  reply_template?: string;
  polling_interval_minutes?: string;
}

export default function NewGatePage() {
  const router = useRouter();
  const { selected } = useChannel();

  const [name, setName] = useState('');
  const [videoId, setVideoId] = useState('');
  const [triggerType, setTriggerType] = useState('keyword');
  const [triggerKeyword, setTriggerKeyword] = useState('');
  const [actionType, setActionType] = useState('reply');
  const [replyTemplate, setReplyTemplate] = useState('');
  const [lotteryRate, setLotteryRate] = useState(10);
  const [hotWindowMinutes, setHotWindowMinutes] = useState('');
  const [pollingIntervalMinutes, setPollingIntervalMinutes] = useState('');

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!name.trim()) e.name = 'ゲート名を入力してください';
    if (triggerType === 'keyword' && !triggerKeyword.trim()) {
      e.trigger_keyword = 'キーワードを入力してください';
    }
    if (actionType === 'reply' && !replyTemplate.trim()) {
      e.reply_template = '返信テンプレートを入力してください';
    }
    const polling = Number(pollingIntervalMinutes);
    if (pollingIntervalMinutes && polling < 5) {
      e.polling_interval_minutes = '最小5分を指定してください';
    }
    return e;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const fieldErrors = validate();
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    if (!selected) return;

    setSubmitting(true);
    try {
      await createGate(selected.id, {
        name: name.trim(),
        video_id: videoId || undefined,
        trigger: triggerType,
        trigger_keyword: triggerType === 'keyword' ? triggerKeyword.trim() : undefined,
        action: actionType,
        reply_template: replyTemplate.trim() || undefined,
        lottery_rate: lotteryRate,
        hot_window_minutes: hotWindowMinutes ? Number(hotWindowMinutes) : undefined,
        polling_interval_minutes: pollingIntervalMinutes ? Number(pollingIntervalMinutes) : undefined,
      });
      router.push('/gates');
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('409')) {
          setSubmitError('同名のゲートが既に存在します');
        } else {
          setSubmitError(`送信に失敗しました: ${err.message}`);
        }
      } else {
        setSubmitError('送信に失敗しました。再試行してください');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const previewText = replyTemplate
    ? interpolateTemplate(replyTemplate, {
        username: '田中 太郎（サンプル）',
        link: 'https://example.com/resource',
      })
    : '';

  const hasUsernameVar = replyTemplate.includes('{username}');
  const hasLinkVar = replyTemplate.includes('{link}');

  if (!selected) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">新規ゲート作成</h1>
        <div className="rounded-lg bg-gray-800 p-6 text-gray-400">
          チャンネルを選択してください
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">新規ゲート作成</h1>

      {submitError && (
        <div className="rounded-lg bg-red-900/30 p-4 text-red-300">{submitError}</div>
      )}

      <form onSubmit={handleSubmit} className="max-w-xl space-y-5 rounded-lg bg-gray-800 p-6">
        {/* ゲート名 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            ゲート名
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 無料PDFゲート"
            maxLength={100}
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
        </div>

        {/* 対象動画 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            対象動画ID（空 = 全動画対象）
          </label>
          <input
            type="text"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="例: dQw4w9WgXcQ"
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* トリガータイプ */}
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

        {/* キーワード */}
        {triggerType === 'keyword' && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              キーワード（カンマ区切り）
            </label>
            <input
              type="text"
              value={triggerKeyword}
              onChange={(e) => setTriggerKeyword(e.target.value)}
              placeholder="例: 無料, PDF, ダウンロード"
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            {errors.trigger_keyword && (
              <p className="mt-1 text-xs text-red-400">{errors.trigger_keyword}</p>
            )}
          </div>
        )}

        {/* アクションタイプ */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            アクションタイプ
          </label>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="reply">コメントに返信</option>
            <option value="dm">DMリンク</option>
          </select>
        </div>

        {/* 返信テンプレート */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            返信テンプレート
          </label>
          <textarea
            rows={4}
            value={replyTemplate}
            onChange={(e) => setReplyTemplate(e.target.value)}
            placeholder="コメントありがとうございます！こちらがリンクです: {link}"
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          {errors.reply_template && (
            <p className="mt-1 text-xs text-red-400">{errors.reply_template}</p>
          )}

          {/* Template preview */}
          {replyTemplate && (
            <div className="mt-2 space-y-2">
              <div className="rounded-md border border-gray-600 bg-gray-900/50 p-3">
                <p className="mb-1 text-xs font-medium text-gray-400">プレビュー</p>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{previewText}</p>
              </div>

              {/* Variable warnings */}
              <div className="flex flex-wrap gap-2">
                {!hasUsernameVar && (
                  <span className="rounded bg-yellow-900/40 px-2 py-0.5 text-xs text-yellow-300">
                    {'{username}'} が未使用です
                  </span>
                )}
                {!hasLinkVar && (
                  <span className="rounded bg-yellow-900/40 px-2 py-0.5 text-xs text-yellow-300">
                    {'{link}'} が未使用です
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 当選確率 */}
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

        {/* ホットウィンドウ */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            ホットウィンドウ（分）
          </label>
          <input
            type="number"
            value={hotWindowMinutes}
            onChange={(e) => setHotWindowMinutes(e.target.value)}
            placeholder="任意"
            min={0}
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* ポーリング間隔 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            ポーリング間隔（分）
          </label>
          <input
            type="number"
            value={pollingIntervalMinutes}
            onChange={(e) => setPollingIntervalMinutes(e.target.value)}
            placeholder="最小5分"
            min={5}
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          {errors.polling_interval_minutes && (
            <p className="mt-1 text-xs text-red-400">{errors.polling_interval_minutes}</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? '送信中...' : 'ゲートを作成'}
          </Button>
          <Button variant="secondary" type="button" onClick={() => router.push('/gates')}>
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  );
}
