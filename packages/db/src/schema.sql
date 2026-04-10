-- ============================================================
-- YouTube Harness — D1 Database Schema
-- ============================================================

-- 1. yt_channels
CREATE TABLE IF NOT EXISTS yt_channels (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id    TEXT    NOT NULL UNIQUE,
  channel_title TEXT    NOT NULL,
  channel_thumbnail    TEXT,
  access_token         TEXT    NOT NULL,
  refresh_token        TEXT    NOT NULL,
  token_expires_at     TEXT    NOT NULL,
  daily_quota_limit    INTEGER NOT NULL DEFAULT 10000,
  quota_alert_threshold INTEGER NOT NULL DEFAULT 500,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 2. videos
CREATE TABLE IF NOT EXISTS videos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id      TEXT    NOT NULL,
  video_id        TEXT    NOT NULL UNIQUE,
  title           TEXT    NOT NULL,
  description     TEXT,
  status          TEXT    NOT NULL DEFAULT 'private',
  published_at    TEXT,
  scheduled_at    TEXT,
  thumbnail_url   TEXT,
  view_count      INTEGER NOT NULL DEFAULT 0,
  like_count      INTEGER NOT NULL DEFAULT 0,
  comment_count   INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (channel_id) REFERENCES yt_channels(channel_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_videos_channel_id ON videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_published_at ON videos(published_at);

-- 3. comments
CREATE TABLE IF NOT EXISTS comments (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id             TEXT    NOT NULL,
  comment_id           TEXT    NOT NULL UNIQUE,
  parent_comment_id    TEXT,
  author_channel_id    TEXT    NOT NULL,
  author_display_name  TEXT    NOT NULL,
  text                 TEXT    NOT NULL,
  like_count           INTEGER NOT NULL DEFAULT 0,
  is_pinned            INTEGER NOT NULL DEFAULT 0,
  published_at         TEXT    NOT NULL,
  created_at           TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_video_id ON comments(video_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_channel_id ON comments(author_channel_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);

-- 4. comment_gates
CREATE TABLE IF NOT EXISTS comment_gates (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id       TEXT    NOT NULL,
  video_id         TEXT    NOT NULL,
  name             TEXT    NOT NULL,
  trigger          TEXT    NOT NULL DEFAULT 'comment',
  trigger_keyword  TEXT,
  action           TEXT    NOT NULL DEFAULT 'reply',
  reply_template   TEXT,
  lottery_rate     REAL,
  is_active        INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (channel_id) REFERENCES yt_channels(channel_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comment_gates_channel_id ON comment_gates(channel_id);
CREATE INDEX IF NOT EXISTS idx_comment_gates_video_id ON comment_gates(video_id);
CREATE INDEX IF NOT EXISTS idx_comment_gates_is_active ON comment_gates(is_active);

-- 5. comment_gate_deliveries
CREATE TABLE IF NOT EXISTS comment_gate_deliveries (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  gate_id               INTEGER NOT NULL,
  subscriber_id         INTEGER,
  youtube_channel_id    TEXT    NOT NULL,
  comment_id            TEXT,
  delivered_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  delivery_status       TEXT    NOT NULL DEFAULT 'delivered',
  FOREIGN KEY (gate_id) REFERENCES comment_gates(id) ON DELETE CASCADE,
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_comment_gate_deliveries_gate_id ON comment_gate_deliveries(gate_id);
CREATE INDEX IF NOT EXISTS idx_comment_gate_deliveries_youtube_channel_id ON comment_gate_deliveries(youtube_channel_id);

-- 6. subscribers
CREATE TABLE IF NOT EXISTS subscribers (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id           TEXT    NOT NULL,
  youtube_channel_id   TEXT    NOT NULL,
  display_name         TEXT    NOT NULL,
  profile_image_url    TEXT,
  subscribed_at        TEXT,
  is_active            INTEGER NOT NULL DEFAULT 1,
  created_at           TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (channel_id) REFERENCES yt_channels(channel_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscribers_channel_id ON subscribers(channel_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_youtube_channel_id ON subscribers(youtube_channel_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_channel_yt_channel ON subscribers(channel_id, youtube_channel_id);

-- 7. subscriber_snapshots
CREATE TABLE IF NOT EXISTS subscriber_snapshots (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  subscriber_id     INTEGER NOT NULL,
  subscriber_count  INTEGER NOT NULL DEFAULT 0,
  snapshot_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscriber_snapshots_subscriber_id ON subscriber_snapshots(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscriber_snapshots_snapshot_at ON subscriber_snapshots(snapshot_at);

-- 8. comment_sequences
CREATE TABLE IF NOT EXISTS comment_sequences (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id  TEXT    NOT NULL,
  name        TEXT    NOT NULL,
  description TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (channel_id) REFERENCES yt_channels(channel_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comment_sequences_channel_id ON comment_sequences(channel_id);

-- 9. sequence_messages
CREATE TABLE IF NOT EXISTS sequence_messages (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  sequence_id      INTEGER NOT NULL,
  step_order       INTEGER NOT NULL,
  delay_minutes    INTEGER NOT NULL DEFAULT 0,
  message_template TEXT    NOT NULL,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sequence_id) REFERENCES comment_sequences(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sequence_messages_sequence_id ON sequence_messages(sequence_id);

-- 10. sequence_enrollments
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  sequence_id   INTEGER NOT NULL,
  subscriber_id INTEGER NOT NULL,
  current_step  INTEGER NOT NULL DEFAULT 0,
  status        TEXT    NOT NULL DEFAULT 'active',
  enrolled_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  last_sent_at  TEXT,
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sequence_id)   REFERENCES comment_sequences(id) ON DELETE CASCADE,
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_sequence_id ON sequence_enrollments(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_subscriber_id ON sequence_enrollments(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_status ON sequence_enrollments(status);

-- 11. playlists
CREATE TABLE IF NOT EXISTS playlists (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id   TEXT    NOT NULL,
  playlist_id  TEXT    NOT NULL UNIQUE,
  title        TEXT    NOT NULL,
  description  TEXT,
  video_count  INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (channel_id) REFERENCES yt_channels(channel_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_playlists_channel_id ON playlists(channel_id);

-- 12. quota_usage
CREATE TABLE IF NOT EXISTS quota_usage (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id  TEXT    NOT NULL,
  endpoint    TEXT    NOT NULL,
  units_used  INTEGER NOT NULL DEFAULT 0,
  used_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (channel_id) REFERENCES yt_channels(channel_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quota_usage_channel_id ON quota_usage(channel_id);
CREATE INDEX IF NOT EXISTS idx_quota_usage_used_at ON quota_usage(used_at);
CREATE INDEX IF NOT EXISTS idx_quota_usage_channel_date ON quota_usage(channel_id, used_at);

-- 13. tags
CREATE TABLE IF NOT EXISTS tags (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id  TEXT    NOT NULL,
  name        TEXT    NOT NULL,
  color       TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (channel_id) REFERENCES yt_channels(channel_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tags_channel_id ON tags(channel_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_channel_name ON tags(channel_id, name);

-- 14. subscriber_tags
CREATE TABLE IF NOT EXISTS subscriber_tags (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  subscriber_id  INTEGER NOT NULL,
  tag_id         INTEGER NOT NULL,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)        REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE (subscriber_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriber_tags_subscriber_id ON subscriber_tags(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscriber_tags_tag_id ON subscriber_tags(tag_id);

-- 15. staff_members
CREATE TABLE IF NOT EXISTS staff_members (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL UNIQUE,
  name       TEXT    NOT NULL,
  role       TEXT    NOT NULL DEFAULT 'viewer',
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 16. settings
CREATE TABLE IF NOT EXISTS settings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id  TEXT    NOT NULL,
  key         TEXT    NOT NULL,
  value       TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (channel_id) REFERENCES yt_channels(channel_id) ON DELETE CASCADE,
  UNIQUE (channel_id, key)
);

CREATE INDEX IF NOT EXISTS idx_settings_channel_id ON settings(channel_id);

-- 17. campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id   TEXT    NOT NULL,
  name         TEXT    NOT NULL,
  description  TEXT,
  gate_id      INTEGER,
  sequence_id  INTEGER,
  status       TEXT    NOT NULL DEFAULT 'draft',
  starts_at    TEXT,
  ends_at      TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (channel_id)   REFERENCES yt_channels(channel_id) ON DELETE CASCADE,
  FOREIGN KEY (gate_id)      REFERENCES comment_gates(id) ON DELETE SET NULL,
  FOREIGN KEY (sequence_id)  REFERENCES comment_sequences(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_campaigns_channel_id ON campaigns(channel_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
