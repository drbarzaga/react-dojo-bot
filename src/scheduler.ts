// src/scheduler.ts
import { sendWeeklyDigest } from "./digest.ts";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function msUntilNextMonday9amUTC(): number {
  const now = new Date();
  const target = new Date(now);
  const day = now.getUTCDay(); // 0=Sun, 1=Mon ... 6=Sat

  if (day === 1) {
    target.setUTCHours(9, 0, 0, 0);
    if (target.getTime() > now.getTime()) return target.getTime() - now.getTime();
    target.setUTCDate(target.getUTCDate() + 7);
    return target.getTime() - now.getTime();
  }

  const daysUntilMonday = (8 - day) % 7;
  target.setUTCDate(now.getUTCDate() + daysUntilMonday);
  target.setUTCHours(9, 0, 0, 0);
  return target.getTime() - now.getTime();
}

async function runDigest(): Promise<void> {
  console.log("Running weekly digest...");
  try {
    await sendWeeklyDigest();
  } catch (err) {
    console.error("Weekly digest error:", err);
  }
  setTimeout(runDigest, WEEK_MS);
}

export function startScheduler(): void {
  const delay = msUntilNextMonday9amUTC();
  const nextRun = new Date(Date.now() + delay);
  console.log(`Weekly digest scheduled for ${nextRun.toUTCString()}`);
  setTimeout(runDigest, delay);
}
