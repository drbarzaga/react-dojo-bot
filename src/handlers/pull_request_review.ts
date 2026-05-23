// src/handlers/pull_request_review.ts
import { sendDiscordEmbed } from "../discord.ts";

const STATE_CONFIG: Record<string, { emoji: string; color: number; label: string }> = {
  approved:          { emoji: "✅", color: 0x639922, label: "approved"          },
  changes_requested: { emoji: "🔴", color: 0xe24b4a, label: "requested changes" },
  commented:         { emoji: "💬", color: 0x378add, label: "commented on"      },
};

export async function handlePullRequestReview(payload: any): Promise<void> {
  const { action, review, pull_request: pr, repository } = payload;

  if (action !== "submitted") return;

  const config = STATE_CONFIG[review.state.toLowerCase()];
  if (!config) return;

  const body = review.body
    ? review.body.slice(0, 200) + (review.body.length > 200 ? "..." : "")
    : "*No comment*";

  await sendDiscordEmbed({
    title: `${config.emoji} ${review.user.login} ${config.label} PR #${pr.number}`,
    description: body,
    url: review.html_url,
    color: config.color,
    author: {
      name: review.user.login,
      url: review.user.html_url,
      icon_url: review.user.avatar_url,
    },
    fields: [
      { name: "PR", value: `[${pr.title}](${pr.html_url})`, inline: false },
    ],
    footer: {
      text: repository.full_name,
      icon_url: "https://github.githubassets.com/favicons/favicon.png",
    },
    timestamp: new Date().toISOString(),
  });
}
