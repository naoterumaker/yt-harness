import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const videos = [
  { id: 'v1', title: 'YouTube Bot の作り方', status: 'published', views: '12.4K', date: '2026/04/05' },
  { id: 'v2', title: 'コメントゲート チュートリアル', status: 'published', views: '8.1K', date: '2026/04/03' },
  { id: 'v3', title: '登録者を増やすコツ', status: 'draft', views: '—', date: '2026/04/02' },
  { id: 'v4', title: 'プレイリスト自動化', status: 'published', views: '5.6K', date: '2026/03/30' },
  { id: 'v5', title: 'YouTube API 詳細解説', status: 'published', views: '3.2K', date: '2026/03/25' },
  { id: 'v6', title: 'チャンネル分析入門', status: 'scheduled', views: '—', date: '2026/04/10' },
];

export default function VideosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">動画</h1>
      </div>

      <div className="rounded-lg bg-gray-800">
        <Table
          headers={['サムネイル', 'タイトル', 'ステータス', '再生回数', '公開日']}
          rows={videos.map((v) => [
            <div key="thumb" className="h-10 w-16 rounded bg-gray-700" />,
            <Link key="title" href={`/videos/${v.id}`} className="text-blue-400 hover:underline">
              {v.title}
            </Link>,
            <Badge
              key="s"
              variant={
                v.status === 'published' ? 'success' : v.status === 'scheduled' ? 'info' : 'warning'
              }
            >
              {v.status === 'published' ? '公開' : v.status === 'scheduled' ? '予約済み' : '下書き'}
            </Badge>,
            v.views,
            v.date,
          ])}
        />
      </div>
    </div>
  );
}
