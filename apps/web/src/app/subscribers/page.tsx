import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const subscribers = [
  { name: 'Tech Fan 99', thumbnail: '', date: 'Apr 5, 2026', tags: ['active', 'commenter'] },
  { name: 'Creator Joe', thumbnail: '', date: 'Apr 4, 2026', tags: ['active'] },
  { name: 'Automate It', thumbnail: '', date: 'Apr 3, 2026', tags: ['gate-triggered'] },
  { name: 'Learner Dev', thumbnail: '', date: 'Apr 2, 2026', tags: ['new'] },
  { name: 'Debug Hero', thumbnail: '', date: 'Apr 1, 2026', tags: ['active', 'commenter'] },
  { name: 'Curious Coder', thumbnail: '', date: 'Mar 30, 2026', tags: ['new'] },
];

export default function SubscribersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Subscribers</h1>

      <div className="rounded-lg bg-gray-800">
        <Table
          headers={['Avatar', 'Name', 'Subscribed', 'Tags']}
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
