import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";

function resolveLocalPaths(env) {
  const dbPath =
    env.RABBITBRAIN_LOCAL_DB_PATH ?? ".rabbitbrain/local-analyses.db";
  const markdownDir =
    env.RABBITBRAIN_LOCAL_MD_DIR ?? ".rabbitbrain/analyses-markdown";

  return { dbPath, markdownDir };
}

function ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      x_url TEXT NOT NULL,
      tweet_id TEXT NOT NULL,
      author_username TEXT NOT NULL,
      topic TEXT NOT NULL,
      app_about TEXT,
      confidence REAL NOT NULL,
      model TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      payload_json TEXT NOT NULL
    );
  `);
}

function buildMarkdown({ id, userId, analyzed }) {
  const createdAtIso = new Date(analyzed.analyzedAt).toISOString();
  const similarPeopleLines =
    analyzed.recommendations.similarPeople.length > 0
      ? analyzed.recommendations.similarPeople
          .map(
            (person) =>
              `- @${person.username} (${person.score}): ${person.reason}`,
          )
          .join("\n")
      : "- None";
  const topicsLines =
    analyzed.recommendations.topicsToFollow.length > 0
      ? analyzed.recommendations.topicsToFollow
          .map((topic) => `- ${topic.topic} (${topic.score}): ${topic.reason}`)
          .join("\n")
      : "- None";
  const creator = analyzed.recommendations.creator;

  return [
    "# Rabbitbrain Analysis",
    "",
    "## Metadata",
    `- ID: ${id}`,
    `- User ID: ${userId}`,
    `- Created At: ${createdAtIso}`,
    `- URL: ${analyzed.xUrl}`,
    `- Author: @${analyzed.internal.authorUsername}`,
    "",
    "## Analysis",
    `- Topic: ${analyzed.analysis.topic}`,
    `- App About: ${analyzed.analysis.appAbout ?? "N/A"}`,
    `- Confidence: ${analyzed.analysis.confidence}`,
    `- Model: ${analyzed.analysis.model}`,
    "",
    "## Post Text",
    analyzed.internal.primaryText,
    "",
    "## Similar People",
    similarPeopleLines,
    "",
    "## Topics To Follow",
    topicsLines,
    "",
    "## Creator Recommendation",
    `- Username: @${creator.username}`,
    `- Should Follow: ${creator.shouldFollow ? "yes" : "no"}`,
    `- Impact Score: ${creator.impactScore}`,
    `- Reason: ${creator.reason}`,
    "",
  ].join("\n");
}

export async function saveAnalysisLocal({
  userId,
  analyzed,
  env = process.env,
}) {
  const { dbPath, markdownDir } = resolveLocalPaths(env);
  mkdirSync(dirname(dbPath), { recursive: true });
  mkdirSync(markdownDir, { recursive: true });

  const db = new Database(dbPath);
  try {
    ensureSchema(db);
    const id = randomUUID();
    const payloadJson = JSON.stringify(analyzed);
    const insert = db.prepare(`
      INSERT INTO analyses (
        id,
        user_id,
        x_url,
        tweet_id,
        author_username,
        topic,
        app_about,
        confidence,
        model,
        created_at,
        payload_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(
      id,
      userId,
      analyzed.xUrl,
      analyzed.internal.tweetId,
      analyzed.internal.authorUsername,
      analyzed.analysis.topic,
      analyzed.analysis.appAbout ?? null,
      analyzed.analysis.confidence,
      analyzed.analysis.model,
      analyzed.analyzedAt,
      payloadJson,
    );

    const markdown = buildMarkdown({ id, userId, analyzed });
    const markdownPath = join(
      markdownDir,
      `${analyzed.internal.tweetId}-${id}.md`,
    );
    writeFileSync(markdownPath, markdown, "utf8");

    return id;
  } finally {
    db.close();
  }
}
