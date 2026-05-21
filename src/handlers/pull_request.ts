// src/handlers/pull_request.ts
import { sendDiscordEmbed } from "../discord.ts";

const ACTION_CONFIG: Record<string, { emoji: string; color: number; label: string }> = {
  opened:           { emoji: "📬", color: 0x1d9e75, label: "opened"           },
  closed:           { emoji: "✅", color: 0x639922, label: "merged"           },
  reopened:         { emoji: "🔄", color: 0xef9f27, label: "reopened"         },
  review_requested: { emoji: "👀", color: 0x378add, label: "review requested" },
};

export async function handlePullRequest(payload: any): Promise<void> {
  const { action, pull_request: pr, repository } = payload;

  const config = ACTION_CONFIG[action];
  if (!config) return;

  if (action === "closed" && !pr.merged) return;

  await sendDiscordEmbed({
    title: `${config.emoji} PR ${config.label}: ${pr.title}`,
    description: pr.body
      ? pr.body.slice(0, 200) + (pr.body.length > 200 ? "..." : "")
      : "*No description*",
    url: pr.html_url,
    color: config.color,
    author: {
      name: pr.user.login,
      url: pr.user.html_url,
      icon_url: pr.user.avatar_url,
    },
    fields: [
      { name: "Branch", value: `\`${pr.head.ref}\` → \`${pr.base.ref}\``, inline: true },
      { name: "Commits", value: `${pr.commits}`, inline: true },
      { name: "Files", value: `${pr.changed_files}`, inline: true },
    ],
    footer: {
      text: repository.full_name,
      icon_url: "https://github.githubassets.com/favicons/favicon.png",
    },
    timestamp: new Date().toISOString(),
  });
}