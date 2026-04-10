import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const gates = [
  { name: 'Free PDF Gate', trigger: 'keyword', action: 'DM link', status: 'active', deliveries: 342 },
  { name: 'Discount Code Gate', trigger: 'keyword', action: 'Reply', status: 'active', deliveries: 128 },
  { name: 'Lottery Giveaway', trigger: 'any_comment', action: 'DM link', status: 'active', deliveries: 56 },
  { name: 'Welcome New Subs', trigger: 'new_subscriber', action: 'Reply', status: 'paused', deliveries: 890 },
  { name: 'Course Promo', trigger: 'keyword', action: 'DM link', status: 'active', deliveries: 215 },
];

export default function GatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Comment Gates</h1>
        <Link href="/gates/new">
          <Button>New Gate</Button>
        </Link>
      </div>

      <div className="rounded-lg bg-gray-800">
        <Table
          headers={['Name', 'Trigger', 'Action', 'Status', 'Deliveries']}
          rows={gates.map((g) => [
            g.name,
            <Badge key="t" variant="info">{g.trigger}</Badge>,
            g.action,
            <Badge key="s" variant={g.status === 'active' ? 'success' : 'warning'}>
              {g.status}
            </Badge>,
            g.deliveries.toLocaleString(),
          ])}
        />
      </div>
    </div>
  );
}
