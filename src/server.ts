// src/server.ts
import { verifyGithubSignature } from "./verify";
import { handlePush } from "./handlers/push";
import { handlePullRequest } from "./handlers/pull_request";
import { handleIssues } from "./handlers/issues";

const PORT = process.env.PORT ?? 3000;
const EXPECTED_REPO = process.env.GITHUB_REPO;
const DISCORD_URL = process.env.DISCORD_WEBHOOK_URL ?? "";

if (!process.env.GITHUB_WEBHOOK_SECRET) {
  console.error("GITHUB_WEBHOOK_SECRET is not set");
  process.exit(1);
}
if (!DISCORD_URL || DISCORD_URL.includes("TU_ID") || DISCORD_URL.includes("TU_TOKEN")) {
  console.error("DISCORD_WEBHOOK_URL is not configured correctly");
  process.exit(1);
}

const EVENT_HANDLERS: Record<string, (payload: any) => Promise<void>> = {
  push:         handlePush,
  pull_request: handlePullRequest,
  issues:       handleIssues,
};

Bun.serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "GET" && url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", repo: EXPECTED_REPO ?? "any" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (req.method !== "POST" || url.pathname !== "/webhook") {
      return new Response("Not found", { status: 404 });
    }

    const rawBody = await req.text();

    const valid = await verifyGithubSignature(req, rawBody);
    if (!valid) {
      console.warn("Invalid signature rejected");
      return new Response("Unauthorized", { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    if (EXPECTED_REPO && payload.repository?.full_name !== EXPECTED_REPO) {
      console.warn(`Ignored repo: ${payload.repository?.full_name}`);
      return new Response("OK", { status: 200 });
    }

    const event = req.headers.get("x-github-event") ?? "unknown";
    const handler = EVENT_HANDLERS[event];

    if (handler) {
      handler(payload).catch((err) =>
        console.error(`Handler error "${event}":`, err)
      );
    } else {
      console.log(`Ignored event: ${event}`);
    }

    return new Response("OK", { status: 200 });
  },
});

console.log(`React Dojo Bot listening on :${PORT} | Repo: ${EXPECTED_REPO ?? "any"}`);