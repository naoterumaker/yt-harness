import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const sequences = [
  { name: 'ウェルカムシリーズ', trigger: '新規登録者', steps: 5, enrolled: 890, status: 'active' },
  { name: '講座アップセル', trigger: 'ゲートトリガー', steps: 3, enrolled: 215, status: 'active' },
  { name: '再エンゲージメント', trigger: '30日間非アクティブ', steps: 4, enrolled: 120, status: 'paused' },
  { name: '抽選フォローアップ', trigger: '抽選当選', steps: 2, enrolled: 56, status: 'active' },
];

export default function SequencesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">シーケンス</h1>

      <div className="rounded-lg bg-gray-800">
        <Table
          headers={['名前', 'トリガー', 'ステップ数', '登録数', 'ステータス']}
          rows={sequences.map((s) => [
            s.name,
            <Badge key="t" variant="info">{s.trigger}</Badge>,
            s.steps,
            s.enrolled.toLocaleString(),
            <Badge key="s" variant={s.status === 'active' ? 'success' : 'warning'}>
              {s.status === 'active' ? '有効' : '一時停止'}
            </Badge>,
          ])}
        />
      </div>
    </div>
  );
}
