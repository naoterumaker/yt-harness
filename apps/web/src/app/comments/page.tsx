import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const comments = [
  { text: '素晴らしい動画！自動化について勉強になりました。', author: '@techfan99', video: 'YouTube Bot の作り方', status: 'approved' },
  { text: 'プレイリストのチュートリアルもお願いします！', author: '@creator_joe', video: 'コメントゲート チュートリアル', status: 'approved' },
  { text: 'ワークフローが完全に変わりました！', author: '@automate_it', video: 'プレイリスト自動化', status: 'approved' },
  { text: '私のチャンネルも見てください！', author: '@spammer42', video: 'YouTube API 詳細解説', status: 'spam' },
  { text: 'パート2をお願いします！', author: '@learner_dev', video: 'YouTube Bot の作り方', status: 'pending' },
  { text: '登録しました！頑張ってください。', author: '@new_sub_01', video: 'チャンネル分析入門', status: 'pending' },
  { text: 'これは何の言語ですか？', author: '@curious_coder', video: 'YouTube API 詳細解説', status: 'approved' },
  { text: '3:42でエラーが出ました、修正方法はありますか？', author: '@debug_hero', video: 'コメントゲート チュートリアル', status: 'pending' },
];

export default function CommentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">コメント</h1>

      <div className="rounded-lg bg-gray-800">
        <Table
          headers={['コメント', '動画', '投稿者', 'ステータス']}
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
              {c.status === 'approved' ? '承認済み' : c.status === 'spam' ? 'スパム' : '保留中'}
            </Badge>,
          ])}
        />
      </div>
    </div>
  );
}
