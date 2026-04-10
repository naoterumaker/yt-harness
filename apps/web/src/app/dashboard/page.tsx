import { Card } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { QuotaGauge } from '@/components/quota-gauge';

const recentVideos = [
  { title: 'YouTube Bot の作り方', status: '公開', views: '12.4K', date: '2026/04/05' },
  { title: 'コメントゲート チュートリアル', status: '公開', views: '8.1K', date: '2026/04/03' },
  { title: '登録者を増やすコツ', status: '下書き', views: '—', date: '2026/04/02' },
  { title: 'プレイリスト自動化', status: '公開', views: '5.6K', date: '2026/03/30' },
];

const recentComments = [
  { text: '素晴らしい動画！勉強になりました。', author: '@techfan99', video: 'YouTube Bot の作り方' },
  { text: 'チュートリアルお願いします…', author: '@creator_joe', video: 'コメントゲート チュートリアル' },
  { text: 'ワークフローが変わりました！', author: '@automate_it', video: 'プレイリスト自動化' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="登録者数" value="24.5K" subtitle="今週 +120" />
        <Card title="総再生回数" value="1.2M" subtitle="今週 +15.3K" />
        <Card title="有効なゲート" value="8" subtitle="本日 3件トリガー" />
        <Card title="保留中のコメント" value="23" subtitle="モデレーション待ち" />
      </div>

      <div className="rounded-lg bg-gray-800 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-gray-200">APIクォータ</h3>
          <span className="text-xs text-gray-400">太平洋時間の深夜にリセット</span>
        </div>
        <QuotaGauge used={4200} limit={10000} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">最近の動画</h3>
          <Table
            headers={['タイトル', 'ステータス', '再生回数', '公開日']}
            rows={recentVideos.map((v) => [
              v.title,
              <Badge key="s" variant={v.status === '公開' ? 'success' : 'warning'}>
                {v.status}
              </Badge>,
              v.views,
              v.date,
            ])}
          />
        </div>

        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">最近のコメント</h3>
          <Table
            headers={['コメント', '投稿者', '動画']}
            rows={recentComments.map((c) => [c.text, c.author, c.video])}
          />
        </div>
      </div>
    </div>
  );
}
