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
        <h1 className="text-2xl font-bold">Video Detail</h1>
        <Badge variant="success">published</Badge>
      </div>

      <div className="rounded-lg bg-gray-800 p-5">
        <div className="mb-4 aspect-video w-full max-w-2xl rounded-lg bg-gray-700" />
        <h2 className="text-xl font-semibold">How to Build a YouTube Bot</h2>
        <p className="mt-1 text-sm text-gray-400">Video ID: {id}</p>
        <p className="mt-2 text-sm text-gray-300">
          A comprehensive guide on building YouTube automation tools using the YouTube Data API v3.
        </p>
        <div className="mt-3 flex gap-2">
          <Badge variant="info">Tutorial</Badge>
          <Badge variant="default">Automation</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Views" value="12,400" subtitle="+340 today" />
        <Card title="Likes" value="1,280" subtitle="10.3% rate" />
        <Card title="Comments" value="89" subtitle="12 pending" />
        <Card title="Watch Time" value="4,200h" subtitle="Avg 8:42 duration" />
      </div>
    </div>
  );
}
