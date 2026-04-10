import { commentGates, comments, videos } from "@yt-harness/db";
import type { YtChannel, CommentGate } from "@yt-harness/shared";

/**
 * Process comment gates for a channel.
 * Hot window strategy: fetch recent comments (last 30 min), match against active gates.
 */
export async function processGates(
  db: D1Database,
  channel: YtChannel,
): Promise<{ processed: number; delivered: number }> {
  const gates = await commentGates.listGates(db, channel.channel_id);
  const activeGates = gates.filter((g) => g.is_active);

  if (activeGates.length === 0) {
    return { processed: 0, delivered: 0 };
  }

  // Fetch recent comments via YouTube API
  const recentComments = await fetchRecentComments(channel);
  let delivered = 0;

  for (const comment of recentComments) {
    // Store comment in DB
    await comments.upsertComment(db, {
      video_id: comment.videoId,
      comment_id: comment.commentId,
      parent_comment_id: comment.parentCommentId ?? null,
      author_channel_id: comment.authorChannelId,
      author_display_name: comment.authorDisplayName,
      text: comment.text,
      like_count: comment.likeCount,
      is_pinned: false,
      published_at: comment.publishedAt,
    });

    // Check against each active gate
    for (const gate of activeGates) {
      if (gate.video_id && gate.video_id !== comment.videoId) continue;

      if (!matchesTrigger(gate, comment)) continue;

      // Check if already delivered
      const existingDeliveries = await commentGates.listDeliveries(db, gate.id);
      const alreadyDelivered = existingDeliveries.some(
        (d) => d.comment_id === comment.commentId,
      );
      if (alreadyDelivered) continue;

      // Lottery check
      if (gate.lottery_rate !== null && Math.random() > gate.lottery_rate) {
        await commentGates.createDelivery(db, {
          gate_id: gate.id,
          subscriber_id: null,
          youtube_channel_id: comment.authorChannelId,
          comment_id: comment.commentId,
          delivered_at: new Date().toISOString(),
          delivery_status: "skipped_lottery",
        });
        continue;
      }

      // Execute action
      const success = await executeAction(channel, gate, comment);
      await commentGates.createDelivery(db, {
        gate_id: gate.id,
        subscriber_id: null,
        youtube_channel_id: comment.authorChannelId,
        comment_id: comment.commentId,
        delivered_at: new Date().toISOString(),
        delivery_status: success ? "delivered" : "failed",
      });

      if (success) delivered++;
    }
  }

  return { processed: recentComments.length, delivered };
}

interface YTComment {
  videoId: string;
  commentId: string;
  parentCommentId?: string;
  authorChannelId: string;
  authorDisplayName: string;
  text: string;
  likeCount: number;
  publishedAt: string;
}

function matchesTrigger(gate: CommentGate, comment: YTComment): boolean {
  switch (gate.trigger) {
    case "comment":
      return true;
    case "comment_keyword":
      if (!gate.trigger_keyword) return false;
      return comment.text
        .toLowerCase()
        .includes(gate.trigger_keyword.toLowerCase());
    default:
      return false;
  }
}

async function executeAction(
  channel: YtChannel,
  gate: CommentGate,
  comment: YTComment,
): Promise<boolean> {
  if (gate.action === "verify_only") return true;

  if (gate.action === "reply" && gate.reply_template) {
    const text = gate.reply_template.replace(
      "{{author}}",
      comment.authorDisplayName,
    );
    try {
      const resp = await fetch(
        "https://www.googleapis.com/youtube/v3/comments?part=snippet",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${channel.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            snippet: {
              parentId: comment.commentId,
              textOriginal: text,
            },
          }),
        },
      );
      return resp.ok;
    } catch {
      return false;
    }
  }

  return false;
}

async function fetchRecentComments(
  channel: YtChannel,
): Promise<YTComment[]> {
  const result: YTComment[] = [];

  try {
    // Fetch comment threads from channel's recent videos
    const resp = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&allThreadsRelatedToChannelId=${channel.channel_id}&maxResults=100&order=time`,
      {
        headers: { Authorization: `Bearer ${channel.access_token}` },
      },
    );

    if (!resp.ok) return result;

    const data = (await resp.json()) as {
      items?: Array<{
        snippet: {
          topLevelComment: {
            id: string;
            snippet: {
              videoId: string;
              authorChannelId: { value: string };
              authorDisplayName: string;
              textOriginal: string;
              likeCount: number;
              publishedAt: string;
            };
          };
        };
      }>;
    };

    for (const item of data.items ?? []) {
      const s = item.snippet.topLevelComment.snippet;
      result.push({
        videoId: s.videoId,
        commentId: item.snippet.topLevelComment.id,
        authorChannelId: s.authorChannelId.value,
        authorDisplayName: s.authorDisplayName,
        text: s.textOriginal,
        likeCount: s.likeCount,
        publishedAt: s.publishedAt,
      });
    }
  } catch {
    // Swallow fetch errors
  }

  return result;
}
