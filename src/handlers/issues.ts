// src/handlers/issues.ts
import { sendDiscordEmbed } from "../discord.ts";

const ACTION_CONFIG: Record<string, { emoji: string; color: number }> = {
  opened:   { emoji: "🐛", color: 0xe24b4a },
  closed:   { emoji: "✔️", color: 0x639922 },
  reopened: { emoji: "🔄", color: 0xef9f27 },
  labeled:  { emoji: "🏷️", color: 0x378add },
};

export async function handleIssues(payload: any): Promise<void> {
  const { action, issue, repository } = payload;

  const config = ACTION_CONFIG[action];
  if (!config) return;

  const labels = issue.labels.map((l: any) => `\`${l.name}\``).join(" ") || "—";

  await sendDiscordEmbed({
    title: `${config.emoji} Issue ${action}: ${issue.title}`,
    url: issue.html_url,
    color: config.color,
    description: issue.body
      ? issue.body.slice(0, 200) + (issue.body.length > 200 ? "..." : "")
      : "*No description*",
    fields: [
      { name: "Labels", value: labels, inline: true },
      { name: "No.", value: `#${issue.number}`, inline: true },
    ],
    author: {
      name: issue.user.login,
      url: issue.user.html_url,
      icon_url: issue.user.avatar_url,
    },
    footer: {
      text: repository.full_name,
      icon_url: "https://github.githubassets.com/favicons/favicon.png",
    },
    timestamp: new Date().toISOString(),
  });
}