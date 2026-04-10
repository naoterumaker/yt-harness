import { Table } from '@/components/ui/table';

const playlists = [
  { title: '入門編', videoCount: 8 },
  { title: '応用テクニック', videoCount: 12 },
  { title: '自動化シリーズ', videoCount: 5 },
  { title: 'ライブ配信', videoCount: 23 },
  { title: 'ショート動画集', videoCount: 45 },
];

export default function PlaylistsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">プレイリスト</h1>

      <div className="rounded-lg bg-gray-800">
        <Table
          headers={['タイトル', '動画数']}
          rows={playlists.map((p) => [p.title, p.videoCount])}
        />
      </div>
    </div>
  );
}
