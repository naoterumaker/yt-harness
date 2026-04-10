import { Table } from '@/components/ui/table';

const playlists = [
  { title: 'Getting Started', videoCount: 8 },
  { title: 'Advanced Techniques', videoCount: 12 },
  { title: 'Automation Series', videoCount: 5 },
  { title: 'Live Streams', videoCount: 23 },
  { title: 'Shorts Collection', videoCount: 45 },
];

export default function PlaylistsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Playlists</h1>

      <div className="rounded-lg bg-gray-800">
        <Table
          headers={['Title', 'Videos']}
          rows={playlists.map((p) => [p.title, p.videoCount])}
        />
      </div>
    </div>
  );
}
