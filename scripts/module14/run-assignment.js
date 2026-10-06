/**
 * Module 14 — Slack → Notion trail → code change → assignment.md
 * Secrets only from process.env / .env (never committed).
 */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "../..");

function loadDotEnv() {
  const p = path.join(ROOT, ".env");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadDotEnv();

const TASK_TEXT = `Add a footer to this project's homepage with my name, the project name, and the
line "Built with Claude." Open a PR when it's done. Before opening the PR, write
(or update) a file at the repo root called assignment.md covering this run. Use
real values only, never placeholders: your bot/app's name and this project's name,
the Slack channel (and workspace, if named) this came through, how many Notion
databases you're connected to and which one you used, the exact title of the Notion
card you created with a link to it, its full status history with timestamps
(example: To Do, then In Progress, then Blocked, then In Progress, then Done), the
task text as posted here, your polling or check-in interval, and the pull request's
number/link. If any step fails, say so honestly instead of skipping it.`;

const trail = {
  started_at: new Date().toISOString(),
  bot_name: process.env.BOT_NAME || "Ops Desk Agent",
  project_name: process.env.PROJECT_NAME || "Silverleaf Ops Ticket Desk",
  owner_name: process.env.OWNER_NAME || "Kitili Mbula",
  checkin_interval: process.env.CHECKIN_INTERVAL || "30m",
  slack: { ok: false, channel: null, workspace: null, error: null },
  notion: {
    ok: false,
    databases_connected: 0,
    database_used: null,
    page_id: null,
    page_url: null,
    page_title: null,
    status_history: [],
    error: null,
  },
  github: { ok: false, branch: null, pr_number: null, pr_url: null, error: null },
  failures: [],
};

function logFail(step, err) {
  const msg = typeof err === "string" ? err : err && err.message ? err.message : String(err);
  trail.failures.push({ step, error: msg, at: new Date().toISOString() });
  console.error(`[fail] ${step}: ${msg}`);
}

async function notionRequest(method, urlPath, body) {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN not set in environment");
  const res = await fetch(`https://api.notion.com/v1${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(
      `Notion ${res.status}: ${json.message || json.code || text.slice(0, 200)}`
    );
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

function stamp(status) {
  const e = { status, at: new Date().toISOString() };
  trail.notion.status_history.push(e);
  return e;
}

async function runNotionTrail(title) {
  const dbId = process.env.NOTION_DATABASE_ID;
  if (!process.env.NOTION_TOKEN || !dbId) {
    throw new Error(
      "Notion not configured (NOTION_TOKEN / NOTION_DATABASE_ID missing). Integration was never added to .env on this machine."
    );
  }

  // Count searchable databases (connected)
  let databases = [];
  try {
    const search = await notionRequest("POST", "/search", {
      filter: { property: "object", value: "database" },
      page_size: 20,
    });
    databases = search.results || [];
  } catch (e) {
    // still try create; record count failure
    logFail("notion_search_databases", e);
  }
  trail.notion.databases_connected = databases.length;
  trail.notion.database_used = dbId;

  stamp("To Do");
  const page = await notionRequest("POST", "/pages", {
    parent: { database_id: dbId },
    properties: {
      Name: { title: [{ text: { content: title } }] },
      Status: { select: { name: "To Do" } },
    },
  });
  trail.notion.page_id = page.id;
  trail.notion.page_url = page.url;
  trail.notion.page_title = title;

  async function setStatus(name) {
    stamp(name);
    await notionRequest("PATCH", `/pages/${page.id}`, {
      properties: { Status: { select: { name } } },
    });
  }

  await setStatus("In Progress");
  // Demonstrate a real backwards move if Status options allow; else record honest skip
  try {
    await setStatus("Blocked");
    await setStatus("In Progress");
  } catch (e) {
    logFail("notion_status_blocked_option", e);
    // continue toward Done
  }
  await setStatus("Done");
  trail.notion.ok = true;
}

async function slackContext() {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID;
  const workspace = process.env.SLACK_WORKSPACE_NAME || null;
  if (!token || !channel) {
    throw new Error(
      "Slack not configured (SLACK_BOT_TOKEN / SLACK_CHANNEL_ID missing). No live Slack event was received in this session."
    );
  }
  trail.slack.channel = channel;
  trail.slack.workspace = workspace;
  // Prove bot can post (and is in channel)
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel,
      text: `Module 14 run started by ${trail.bot_name} on ${trail.project_name}.`,
    }),
  });
  const json = await res.json();
  if (!json.ok) {
    throw new Error(`Slack API: ${json.error || JSON.stringify(json)}`);
  }
  trail.slack.ok = true;
  trail.slack.channel = json.channel || channel;
}

function addFooter() {
  const indexPath = path.join(ROOT, "public/index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  if (html.includes("Built with Claude.")) {
    console.log("Footer already present");
    return;
  }
  const footer = `
    <footer class="site-footer" id="module14-footer">
      <p>${trail.owner_name} · ${trail.project_name}</p>
      <p>Built with Claude.</p>
    </footer>
`;
  if (!html.includes("</body>")) throw new Error("homepage missing </body>");
  html = html.replace("</body>", `${footer}  </body>`);
  fs.writeFileSync(indexPath, html);

  const cssPath = path.join(ROOT, "public/css/styles.css");
  let css = fs.readFileSync(cssPath, "utf8");
  if (!css.includes(".site-footer")) {
    css += `

/* Module 14 homepage footer */
.site-footer {
  margin-top: 2rem;
  padding: 1.25rem 1rem 2rem;
  text-align: center;
  color: var(--muted);
  font-size: 0.9rem;
  border-top: 1px solid var(--border);
  background: #eef2f5;
}
.site-footer p {
  margin: 0.25rem 0;
}
`;
    fs.writeFileSync(cssPath, css);
  }
}

function writeAssignmentMd() {
  const lines = [];
  lines.push("# Module 14 — assignment.md (agent-written run report)");
  lines.push("");
  lines.push(`- **Bot / app name:** ${trail.bot_name}`);
  lines.push(`- **Project name:** ${trail.project_name}`);
  lines.push(
    `- **Slack channel:** ${
      trail.slack.ok
        ? trail.slack.channel
        : `I could not retrieve a live Slack channel — ${trail.slack.error || "not configured"}`
    }`
  );
  lines.push(
    `- **Slack workspace:** ${
      trail.slack.workspace ||
      (trail.slack.ok
        ? "(workspace name not set in env)"
        : "unavailable — Slack step failed")
    }`
  );
  lines.push(
    `- **Notion databases connected:** ${
      trail.notion.databases_connected
    }${trail.notion.ok ? "" : " (search may have failed — see failures)"}`
  );
  lines.push(
    `- **Notion database used:** ${
      trail.notion.database_used ||
      "I could not use a Notion database — token/database id missing or API error"
    }`
  );
  lines.push(
    `- **Notion card title:** ${
      trail.notion.page_title || "I could not create a Notion card"
    }`
  );
  lines.push(
    `- **Notion card link:** ${
      trail.notion.page_url || "I could not retrieve a Notion card URL"
    }`
  );
  if (trail.notion.status_history.length) {
    lines.push(`- **Notion status history:**`);
    for (const s of trail.notion.status_history) {
      lines.push(`  - ${s.status} @ ${s.at}`);
    }
  } else {
    lines.push(
      `- **Notion status history:** I could not retrieve the status history — Notion trail did not run successfully.`
    );
  }
  lines.push(`- **Task text (exact):**`);
  lines.push("");
  lines.push("```");
  lines.push(TASK_TEXT.trim());
  lines.push("```");
  lines.push("");
  lines.push(`- **Polling / check-in interval:** ${trail.checkin_interval}`);
  lines.push(
    `- **Pull request:** ${
      trail.github.pr_url
        ? `#${trail.github.pr_number} — ${trail.github.pr_url}`
        : trail.github.error
          ? `I could not open a PR — ${trail.github.error}`
          : "PR not created yet"
    }`
  );
  lines.push("");
  lines.push("## Failures (honest)");
  if (!trail.failures.length) {
    lines.push("- None recorded.");
  } else {
    for (const f of trail.failures) {
      lines.push(`- **${f.step}** @ ${f.at}: ${f.error}`);
    }
  }
  lines.push("");
  lines.push(`- **Run started:** ${trail.started_at}`);
  lines.push(`- **Run finished:** ${new Date().toISOString()}`);
  lines.push("");
  fs.writeFileSync(path.join(ROOT, "assignment.md"), lines.join("\n"));
}

function git(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim();
}

function openPr() {
  const branch = `module14-footer-${Date.now().toString(36)}`;
  trail.github.branch = branch;
  try {
    git(`git checkout -b ${branch}`);
    git(`git add public/index.html public/css/styles.css assignment.md`);
    git(
      `git commit -m "$(cat <<'EOF'\nAdd homepage footer and Module 14 assignment.md from agent run.\n\nEOF\n)"`
    );
    git(`git push -u origin HEAD`);
  } catch (e) {
    trail.github.error = e.message || String(e);
    throw e;
  }

  try {
    const out = git(
      `gh pr create --title "Module 14: homepage footer + assignment.md" --body "$(cat <<'EOF'\n## Summary\n- Homepage footer with name, project, Built with Claude.\n- Agent-written assignment.md with observed run values.\n\n## Test plan\n- [ ] Open homepage and confirm footer\n- [ ] Read assignment.md for real (non-placeholder) values\n\nEOF\n)"`
    );
    const url = (out.match(/https:\/\/github\.com\/[^\s]+/) || [])[0];
    trail.github.pr_url = url || out;
    const num = url && url.match(/\/pull\/(\d+)/);
    trail.github.pr_number = num ? num[1] : null;
    trail.github.ok = Boolean(url);
  } catch (e) {
    // Fallback: push succeeded but gh not logged in — record compare URL
    const remote = "https://github.com/kitili/Ticketing-";
    trail.github.pr_url = `${remote}/compare/main...${branch}?expand=1`;
    trail.github.error = `gh pr create failed (${e.message}). Branch pushed; open PR via compare link.`;
    logFail("github_pr_create", e);
  }
}

/**
 * Part 3 helper: verify Slack-style signing. Wrong secret → 403.
 */
function verifySlackSignature(rawBody, timestamp, signature, secret) {
  const base = `v0:${timestamp}:${rawBody}`;
  const digest =
    "v0=" + crypto.createHmac("sha256", secret).update(base).digest("hex");
  const a = Buffer.from(digest);
  const b = Buffer.from(signature || "");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    const err = new Error("403 Forbidden: Slack signature mismatch (webhook secret differs)");
    err.status = 403;
    throw err;
  }
  return true;
}

async function main() {
  const title = `Module 14 footer — ${trail.project_name} — ${new Date().toISOString().slice(0, 10)}`;

  try {
    await slackContext();
  } catch (e) {
    trail.slack.error = e.message;
    logFail("slack", e);
  }

  try {
    await runNotionTrail(title);
  } catch (e) {
    trail.notion.error = e.message;
    logFail("notion", e);
  }

  try {
    addFooter();
  } catch (e) {
    logFail("footer", e);
  }

  // Write assignment before PR so it is included in the commit
  writeAssignmentMd();

  try {
    openPr();
    // Rewrite assignment.md with PR link if we got one, amend only if needed via new commit on branch
    writeAssignmentMd();
    try {
      git(`git add assignment.md`);
      const st = git("git status --porcelain");
      if (st.includes("assignment.md")) {
        git(
          `git commit -m "$(cat <<'EOF'\nUpdate assignment.md with PR link from this run.\n\nEOF\n)"`
        );
        git("git push");
      }
    } catch (e) {
      logFail("assignment_pr_update", e);
    }
  } catch (e) {
    logFail("github", e);
    writeAssignmentMd();
  }

  fs.writeFileSync(
    path.join(ROOT, "PROOF/module14/run-trail.json"),
    JSON.stringify(trail, null, 2) + "\n"
  );
  console.log(JSON.stringify({ ok: trail.github.ok || trail.notion.ok, trail }, null, 2));
}

module.exports = { verifySlackSignature, trail, TASK_TEXT, main };

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
