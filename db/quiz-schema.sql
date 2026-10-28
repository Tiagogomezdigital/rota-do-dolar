PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  content_version TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  started_at INTEGER,
  last_seen INTEGER NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 0,
  furthest_step INTEGER NOT NULL DEFAULT 0,
  completed_at INTEGER,
  cta_clicked_at INTEGER,
  source TEXT NOT NULL DEFAULT 'direto',
  device TEXT NOT NULL DEFAULT 'desktop'
);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON sessions(last_seen);

CREATE TABLE IF NOT EXISTS answers (
  session_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  option_id TEXT NOT NULL,
  answered_at INTEGER NOT NULL,
  PRIMARY KEY(session_id, question_id),
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON UPDATE NO ACTION ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS step_views (
  session_id TEXT NOT NULL,
  step INTEGER NOT NULL,
  first_seen INTEGER NOT NULL,
  PRIMARY KEY(session_id, step),
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON UPDATE NO ACTION ON DELETE CASCADE
);
