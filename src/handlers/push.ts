// src/handlers/push.ts
import { sendDiscordEmbed } from "../discord.ts";

const WATCH_BRANCH = process.env.WATCH_BRANCH ?? "main";

export async function handlePush(payload: any): Promise<void> {
  const { ref, commits, pusher, repository, compare } = payload;

  if (ref !== `refs/heads/${WATCH_BRANCH}`) return;

  const branch = ref.replace("refs/heads/", "");
  const commitCount = commits.length;
  const repoName = repository.full_name;

  const commitList = commits
    .slice(0, 5)
    .map((c: any) => {
      const short = c.id.slice(0, 7);
      const msg = c.message.split("\n")[0];
      return `[\`${short}\`](${c.url}) ${msg}`;
    })
    .join("\n");

  const extra = commitCount > 5 ? `\n*...and ${commitCount - 5} more*` : "";

  await sendDiscordEmbed({
    title: `🔀 ${commitCount} commit${commitCount > 1 ? "s" : ""} to \`${branch}\``,
    description: commitList + extra,
    url: compare,
    color: 0x7f77dd, // React Dojo purple
    author: {
      name: pusher.name,
      url: `https://github.com/${pusher.name}`,
      icon_url: `https://github.com/${pusher.name}.png?size=32`,
    },
    footer: {
      text: repoName,
      icon_url: "https://github.githubassets.com/favicons/favicon.png",
    },
    timestamp: new Date().toISOString(),
  });
}