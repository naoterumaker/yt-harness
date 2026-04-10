import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const gates = [
  { name: '無料PDFゲート', trigger: 'キーワード', action: 'DMリンク', status: 'active', deliveries: 342 },
  { name: '割引コードゲート', trigger: 'キーワード', action: '返信', status: 'active', deliveries: 128 },
  { name: '抽選プレゼント', trigger: '全コメント', action: 'DMリンク', status: 'active', deliveries: 56 },
  { name: '新規登録者歓迎', trigger: '新規登録者', action: '返信', status: 'paused', deliveries: 890 },
  { name: '講座プロモーション', trigger: 'キーワード', action: 'DMリンク', status: 'active', deliveries: 215 },
];

export default function GatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">コメントゲート</h1>
        <Link href="/gates/new">
          <Button>新規ゲート</Button>
        </Link>
      </div>

      <div className="rounded-lg bg-gray-800">
        <Table
          headers={['名前', 'トリガー', 'アクション', 'ステータス', '配信数']}
          rows={gates.map((g) => [
            g.name,
            <Badge key="t" variant="info">{g.trigger}</Badge>,
            g.action,
            <Badge key="s" variant={g.status === 'active' ? 'success' : 'warning'}>
              {g.status === 'active' ? '有効' : '一時停止'}
            </Badge>,
            g.deliveries.toLocaleString(),
          ])}
        />
      </div>
    </div>
  );
}
