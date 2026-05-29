-- Silverleaf Ops Ticket Desk — run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  department TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  campus TEXT DEFAULT '',
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  urgency TEXT DEFAULT 'normal',
  category TEXT DEFAULT 'General',
  priority TEXT DEFAULT 'normal',
  assigned_to TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_seen_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  closed_at TIMESTAMPTZ,
  closed_by TEXT,
  declined_at TIMESTAMPTZ,
  declined_by TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  author_role TEXT NOT NULL,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_department ON requests(department);
CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_request ON messages(request_id);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_settings" ON settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_requests" ON requests FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_messages" ON messages FOR ALL TO anon USING (true) WITH CHECK (true);

-- Default manager PIN: Ops2026 (change in app Settings after first login)
-- Salt + hash generated with PBKDF2-SHA256, 120000 iterations
INSERT INTO settings(key, value) VALUES
  ('pin_salt', 'silverleaf_ops_salt_v1'),
  ('manager_pin_hash', '5ed995e13af18cd70f3db881e3d785957310bebaf811e566f0b70ead8098236c')
ON CONFLICT (key) DO NOTHING;
