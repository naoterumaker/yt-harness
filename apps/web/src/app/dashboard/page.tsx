import { Card } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { QuotaGauge } from '@/components/quota-gauge';

const recentVideos = [
  { title: 'How to Build a YouTube Bot', status: 'published', views: '12.4K', date: 'Apr 5, 2026' },
  { title: 'Comment Gate Tutorial', status: 'published', views: '8.1K', date: 'Apr 3, 2026' },
  { title: 'Subscriber Growth Hacks', status: 'draft', views: '—', date: 'Apr 2, 2026' },
  { title: 'Playlist Automation', status: 'published', views: '5.6K', date: 'Mar 30, 2026' },
];

const recentComments = [
  { text: 'Great video! Learned a lot.', author: '@techfan99', video: 'How to Build a YouTube Bot' },
  { text: 'Can you do a tutorial on...', author: '@creator_joe', video: 'Comment Gate Tutorial' },
  { text: 'This changed my workflow!', author: '@automate_it', video: 'Playlist Automation' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Subscribers" value="24.5K" subtitle="+120 this week" />
        <Card title="Total Views" value="1.2M" subtitle="+15.3K this week" />
        <Card title="Active Gates" value="8" subtitle="3 triggered today" />
        <Card title="Pending Comments" value="23" subtitle="Awaiting moderation" />
      </div>

      <div className="rounded-lg bg-gray-800 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-gray-200">API Quota</h3>
          <span className="text-xs text-gray-400">Resets at midnight PT</span>
        </div>
        <QuotaGauge used={4200} limit={10000} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">Recent Videos</h3>
          <Table
            headers={['Title', 'Status', 'Views', 'Date']}
            rows={recentVideos.map((v) => [
              v.title,
              <Badge key="s" variant={v.status === 'published' ? 'success' : 'warning'}>
                {v.status}
              </Badge>,
              v.views,
              v.date,
            ])}
          />
        </div>

        <div className="rounded-lg bg-gray-800 p-5">
          <h3 className="mb-3 font-medium text-gray-200">Recent Comments</h3>
          <Table
            headers={['Comment', 'Author', 'Video']}
            rows={recentComments.map((c) => [c.text, c.author, c.video])}
          />
        </div>
      </div>
    </div>
  );
}
