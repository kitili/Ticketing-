/**
 * SQLite database setup and helpers.
 */

const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "ops-requests.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

const DEPARTMENTS = ["Transport", "Facilities", "Kitchen", "Security", "Farms"];

function tryExec(sql) {
  try {
    db.exec(sql);
  } catch (_e) {
    // SQLite doesn't support IF NOT EXISTS for ADD COLUMN; ignore if already applied.
  }
}

function initDb() {
  db.exec(`
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
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL,
      first_seen_at TEXT,
      approved_at TEXT,
      approved_by TEXT,
      delivered_at TEXT,
      delivered_by TEXT,
      received_at TEXT,
      received_by TEXT,
      declined_at TEXT,
      declined_by TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT NOT NULL,
      author_role TEXT NOT NULL,
      author_name TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (request_id) REFERENCES requests(id)
    );

    CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
    CREATE INDEX IF NOT EXISTS idx_requests_department ON requests(department);
    CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at);
  `);

  // Instance salt for hashing manager PIN
  const saltRow = db.prepare(`SELECT value FROM settings WHERE key='pin_salt'`).get();
  if (!saltRow) {
    const salt = require("crypto").randomBytes(16).toString("hex");
    db.prepare(`INSERT INTO settings(key, value) VALUES ('pin_salt', ?)`).run(salt);
  }

  // ---- Ticket-system migration (adds fields + status model) ----
  tryExec(`ALTER TABLE requests ADD COLUMN category TEXT DEFAULT 'General'`);
  tryExec(`ALTER TABLE requests ADD COLUMN priority TEXT DEFAULT 'normal'`);
  tryExec(`ALTER TABLE requests ADD COLUMN assigned_to TEXT DEFAULT ''`);
  tryExec(`ALTER TABLE requests ADD COLUMN updated_at TEXT`);
  tryExec(`ALTER TABLE requests ADD COLUMN resolved_at TEXT`);
  tryExec(`ALTER TABLE requests ADD COLUMN resolved_by TEXT`);
  tryExec(`ALTER TABLE requests ADD COLUMN closed_at TEXT`);
  tryExec(`ALTER TABLE requests ADD COLUMN closed_by TEXT`);

  // Map older statuses to ticket statuses.
  db.exec(`
    UPDATE requests SET status='open' WHERE status='new';
    UPDATE requests SET status='in_progress' WHERE status IN ('in_review','approved');
    UPDATE requests SET status='resolved' WHERE status='delivered';
    UPDATE requests SET status='closed', closed_at=COALESCE(closed_at, received_at), closed_by=COALESCE(closed_by, received_by) WHERE status='received';
    UPDATE requests SET status='declined' WHERE status='declined';
  `);

  // Bootstrap manager PIN hash if not set yet (from env or safe default).
  const pinRow = db.prepare(`SELECT value FROM settings WHERE key='manager_pin_hash'`).get();
  if (!pinRow) {
    const salt = db.prepare(`SELECT value FROM settings WHERE key='pin_salt'`).get().value;
    const pin = process.env.MANAGER_PIN || "change-me";
    const hash = require("crypto")
      .pbkdf2Sync(pin, salt, 120000, 32, "sha256")
      .toString("hex");
    db.prepare(`INSERT INTO settings(key, value) VALUES ('manager_pin_hash', ?)`).run(hash);
  }

  const count = db.prepare("SELECT COUNT(*) AS n FROM requests").get().n;
  if (count === 0) {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO requests (
        id, department, requester_name, campus, title, details, urgency, status, created_at, category, priority, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      "REQ-001",
      "Kitchen",
      "Sample Staff",
      "Arusha Modern",
      "Gas cylinder refill",
      "Backup kitchen cylinder is empty; need refill before weekend service.",
      "urgent",
      "open",
      now,
      "Supplies",
      "high",
      now
    );
    db.prepare(
      `INSERT INTO messages (request_id, author_role, author_name, body, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      "REQ-001",
      "requester",
      "Sample Staff",
      "Submitted via demo seed.",
      now
    );
  }
}

function nextRequestId() {
  const row = db
    .prepare(
      `SELECT id FROM requests WHERE id LIKE 'REQ-%' ORDER BY CAST(SUBSTR(id, 5) AS INTEGER) DESC LIMIT 1`
    )
    .get();
  if (!row) return "REQ-001";
  const n = parseInt(row.id.replace("REQ-", ""), 10) + 1;
  return "REQ-" + String(n).padStart(3, "0");
}

initDb();

module.exports = { db, DEPARTMENTS, nextRequestId, DB_PATH };
