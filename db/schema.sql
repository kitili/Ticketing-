-- Silverleaf Ops Ticket Desk — assessment schema (Supabase / Postgres)
-- Final ERD: SETTINGS, REQUEST, MESSAGE — UUID PKs, FK on many side, created_at.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  requester_name TEXT NOT NULL DEFAULT '',
  campus TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  urgency TEXT NOT NULL DEFAULT 'normal',
  category TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_role TEXT NOT NULL,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  request_id UUID NOT NULL REFERENCES requests (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON requests (status);
CREATE INDEX IF NOT EXISTS idx_requests_department ON requests (department);
CREATE INDEX IF NOT EXISTS idx_messages_request ON messages (request_id);
