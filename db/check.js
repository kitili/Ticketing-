/**
 * npm run db:check — connect, list tables, insert request + message, join-read.
 */
const fs = require("fs");
const path = require("path");
const { pool, query } = require("./client");

async function ensureSchema() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await query(sql);
}

async function main() {
  console.log("Connecting to database…");
  await ensureSchema();

  const tables = await query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name IN ('settings', 'requests', 'messages')
    ORDER BY table_name
  `);
  console.log("\nTicketing tables:");
  for (const row of tables.rows) {
    console.log(`  - ${row.table_name}`);
  }

  console.log("\nInserting sample request + linked message…");

  await query(
    `INSERT INTO settings (key, value)
     VALUES ('ops_manager_email', 'baraka@silverleaf.co.tz')
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
  );

  const req = await query(
    `INSERT INTO requests
       (department, requester_name, campus, title, details, urgency, category, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, department, title, status, created_at`,
    [
      "Facilities",
      "Kitili",
      "Main",
      "Broken AC in ops office",
      "AC not cooling — needs technician",
      "high",
      "Maintenance",
      "open",
    ]
  );
  const requestId = req.rows[0].id;
  console.log("Request:", req.rows[0]);

  const msg = await query(
    `INSERT INTO messages (author_role, author_name, body, request_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, author_role, author_name, body, request_id`,
    ["manager", "Ops Manager", "Technician assigned for tomorrow morning.", requestId]
  );
  console.log("Message:", msg.rows[0]);

  const joined = await query(
    `SELECT
       r.department,
       r.title,
       r.status,
       m.author_name,
       m.body AS comment,
       m.created_at AS comment_at
     FROM requests r
     JOIN messages m ON m.request_id = r.id
     WHERE r.id = $1`,
    [requestId]
  );

  console.log("\nJoin result:");
  console.table(joined.rows);
  console.log("\n✅ db:check passed — connected, wrote rows, joined them back.");
}

main()
  .catch((err) => {
    console.error("\n❌ db:check failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
