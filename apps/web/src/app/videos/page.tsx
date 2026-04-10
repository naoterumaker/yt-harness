import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const videos = [
  { id: 'v1', title: 'How to Build a YouTube Bot', status: 'published', views: '12.4K', date: 'Apr 5, 2026' },
  { id: 'v2', title: 'Comment Gate Tutorial', status: 'published', views: '8.1K', date: 'Apr 3, 2026' },
  { id: 'v3', title: 'Subscriber Growth Hacks', status: 'draft', views: '—', date: 'Apr 2, 2026' },
  { id: 'v4', title: 'Playlist Automation', status: 'published', views: '5.6K', date: 'Mar 30, 2026' },
  { id: 'v5', title: 'YouTube API Deep Dive', status: 'published', views: '3.2K', date: 'Mar 25, 2026' },
  { id: 'v6', title: 'Channel Analytics 101', status: 'scheduled', views: '—', date: 'Apr 10, 2026' },
];

export default function VideosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Videos</h1>
      </div>

      <div className="rounded-lg bg-gray-800">
        <Table
          headers={['Thumbnail', 'Title', 'Status', 'Views', 'Date']}
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
              {v.status}
            </Badge>,
            v.views,
            v.date,
          ])}
        />
      </div>
    </div>
  );
}
