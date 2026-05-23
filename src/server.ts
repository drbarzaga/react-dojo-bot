// src/server.ts
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { verifyGithubSignature } from "./verify.ts";
import { handlePush } from "./handlers/push.ts";
import { handlePullRequest } from "./handlers/pull_request.ts";
import { handleIssues } from "./handlers/issues.ts";
import { handleStar } from "./handlers/star.ts";
import { handleFork } from "./handlers/fork.ts";
import { sendWeeklyDigest } from "./digest.ts";
import { startScheduler } from "./scheduler.ts";

const PORT = Number(process.env.PORT ?? 3000);
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

const DIGEST_MIN_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
let lastDigestAt = 0;

const EVENT_HANDLERS: Record<string, (payload: any) => Promise<void>> = {
  push:         handlePush,
  pull_request: handlePullRequest,
  issues:       handleIssues,
  star:         handleStar,
  fork:         handleFork,
};

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (req.method === "GET" && url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", repo: EXPECTED_REPO ?? "any" }));
      return;
    }

    if (req.method === "POST" && url.pathname === "/digest") {
      const auth = req.headers["authorization"] ?? "";
      if (auth !== `Bearer ${process.env.GITHUB_WEBHOOK_SECRET}`) {
        res.writeHead(401);
        res.end("Unauthorized");
        return;
      }
      const now = Date.now();
      const elapsed = now - lastDigestAt;
      if (elapsed < DIGEST_MIN_INTERVAL_MS) {
        const retryAfter = Math.ceil((DIGEST_MIN_INTERVAL_MS - elapsed) / 1000);
        res.writeHead(429, { "Retry-After": String(retryAfter) });
        res.end(`Rate limited. Try again in ${retryAfter}s`);
        return;
      }
      lastDigestAt = now;
      sendWeeklyDigest().catch((err: Error) => console.error("Digest error:", err));
      res.writeHead(202);
      res.end("Digest triggered");
      return;
    }

    if (req.method !== "POST" || url.pathname !== "/webhook") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const rawBody = await readBody(req);
    const signature = (req.headers["x-hub-signature-256"] as string) ?? null;

    const valid = await verifyGithubSignature(signature, rawBody);
    if (!valid) {
      console.warn("Invalid signature rejected");
      res.writeHead(401);
      res.end("Unauthorized");
      return;
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      res.writeHead(400);
      res.end("Bad Request");
      return;
    }

    if (EXPECTED_REPO && payload.repository?.full_name !== EXPECTED_REPO) {
      console.warn(`Ignored repo: ${payload.repository?.full_name}`);
      res.writeHead(200);
      res.end("OK");
      return;
    }

    const event = (req.headers["x-github-event"] as string) ?? "unknown";
    const handler = EVENT_HANDLERS[event];

    if (handler) {
      handler(payload).catch((err: Error) =>
        console.error(`Handler error "${event}":`, err)
      );
    } else {
      console.log(`Ignored event: ${event}`);
    }

    res.writeHead(200);
    res.end("OK");
  } catch (err) {
    console.error("Unexpected error:", err);
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

server.listen(PORT, () => {
  console.log(`React Dojo Bot listening on :${PORT} | Repo: ${EXPECTED_REPO ?? "any"}`);
  startScheduler();
});
