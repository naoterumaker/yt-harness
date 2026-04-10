import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const sequences = [
  { name: 'Welcome Series', trigger: 'new_subscriber', steps: 5, enrolled: 890, status: 'active' },
  { name: 'Course Upsell', trigger: 'gate_triggered', steps: 3, enrolled: 215, status: 'active' },
  { name: 'Re-engagement', trigger: 'inactive_30d', steps: 4, enrolled: 120, status: 'paused' },
  { name: 'Contest Follow-up', trigger: 'lottery_win', steps: 2, enrolled: 56, status: 'active' },
];

export default function SequencesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sequences</h1>

      <div className="rounded-lg bg-gray-800">
        <Table
          headers={['Name', 'Trigger', 'Steps', 'Enrolled', 'Status']}
          rows={sequences.map((s) => [
            s.name,
            <Badge key="t" variant="info">{s.trigger}</Badge>,
            s.steps,
            s.enrolled.toLocaleString(),
            <Badge key="s" variant={s.status === 'active' ? 'success' : 'warning'}>
              {s.status}
            </Badge>,
          ])}
        />
      </div>
    </div>
  );
}
