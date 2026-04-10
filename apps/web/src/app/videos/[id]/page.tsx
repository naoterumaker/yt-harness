import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VideoDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">動画詳細</h1>
        <Badge variant="success">公開</Badge>
      </div>

      <div className="rounded-lg bg-gray-800 p-5">
        <div className="mb-4 aspect-video w-full max-w-2xl rounded-lg bg-gray-700" />
        <h2 className="text-xl font-semibold">YouTube Bot の作り方</h2>
        <p className="mt-1 text-sm text-gray-400">動画ID: {id}</p>
        <p className="mt-2 text-sm text-gray-300">
          YouTube Data API v3を使ったYouTube自動化ツールの構築に関する包括的なガイドです。
        </p>
        <div className="mt-3 flex gap-2">
          <Badge variant="info">チュートリアル</Badge>
          <Badge variant="default">自動化</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="再生回数" value="12,400" subtitle="本日 +340" />
        <Card title="高評価" value="1,280" subtitle="10.3%の率" />
        <Card title="コメント数" value="89" subtitle="12件保留中" />
        <Card title="視聴時間" value="4,200h" subtitle="平均 8:42" />
      </div>
    </div>
  );
}
