import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const comments = [
  { text: 'Great video! Learned a lot about automation.', author: '@techfan99', video: 'How to Build a YouTube Bot', status: 'approved' },
  { text: 'Can you do a tutorial on playlists?', author: '@creator_joe', video: 'Comment Gate Tutorial', status: 'approved' },
  { text: 'This changed my workflow completely!', author: '@automate_it', video: 'Playlist Automation', status: 'approved' },
  { text: 'Check out my channel for more!', author: '@spammer42', video: 'YouTube API Deep Dive', status: 'spam' },
  { text: 'Please make a part 2!', author: '@learner_dev', video: 'How to Build a YouTube Bot', status: 'pending' },
  { text: 'Subscribed! Keep it up.', author: '@new_sub_01', video: 'Channel Analytics 101', status: 'pending' },
  { text: 'What language is this in?', author: '@curious_coder', video: 'YouTube API Deep Dive', status: 'approved' },
  { text: 'I got an error at 3:42, any fix?', author: '@debug_hero', video: 'Comment Gate Tutorial', status: 'pending' },
];

export default function CommentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Comments</h1>

      <div className="rounded-lg bg-gray-800">
        <Table
          headers={['Comment', 'Video', 'Author', 'Status']}
          rows={comments.map((c) => [
            <span key="t" className="line-clamp-1 max-w-xs">{c.text}</span>,
            c.video,
            c.author,
            <Badge
              key="s"
              variant={
                c.status === 'approved'
                  ? 'success'
                  : c.status === 'spam'
                    ? 'danger'
                    : 'warning'
              }
            >
              {c.status}
            </Badge>,
          ])}
        />
      </div>
    </div>
  );
}
