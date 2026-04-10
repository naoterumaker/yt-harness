import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const subscribers = [
  { name: 'テックファン99', thumbnail: '', date: '2026/04/05', tags: ['アクティブ', 'コメント投稿者'] },
  { name: 'クリエイタージョー', thumbnail: '', date: '2026/04/04', tags: ['アクティブ'] },
  { name: 'オートメイト', thumbnail: '', date: '2026/04/03', tags: ['ゲートトリガー'] },
  { name: 'ラーナーデブ', thumbnail: '', date: '2026/04/02', tags: ['新規'] },
  { name: 'デバッグヒーロー', thumbnail: '', date: '2026/04/01', tags: ['アクティブ', 'コメント投稿者'] },
  { name: 'キュリアスコーダー', thumbnail: '', date: '2026/03/30', tags: ['新規'] },
];

export default function SubscribersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">登録者</h1>

      <div className="rounded-lg bg-gray-800">
        <Table
          headers={['アバター', '名前', '登録日', 'タグ']}
          rows={subscribers.map((s) => [
            <div key="av" className="h-8 w-8 rounded-full bg-gray-600" />,
            s.name,
            s.date,
            <div key="tags" className="flex gap-1">
              {s.tags.map((tag) => (
                <Badge key={tag} variant="info">{tag}</Badge>
              ))}
            </div>,
          ])}
        />
      </div>
    </div>
  );
}
