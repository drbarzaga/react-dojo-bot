// src/handlers/star.ts
import { sendDiscordEmbed } from "../discord.ts";

const MILESTONES = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

const MILESTONE_MESSAGES: Record<number, string> = {
  5:     "First 5 stars — the rocket just launched 🚀",
  10:    "10 stars — double digits, let's go 💪",
  25:    "25 stars — the community is growing 🌱",
  50:    "50 stars — people are noticing ⚡",
  100:   "100 stars — triple digits, a real milestone 🏆",
  250:   "250 stars — React Dojo is on the map 🗺️",
  500:   "500 stars — this is a serious project 🔥",
  1000:  "1,000 stars — a thousand people trust the dojo 👑",
  2500:  "2,500 stars — running with the big ones ✨",
  5000:  "5,000 stars — elite level 🥷",
  10000: "10,000 stars — React Dojo is legendary 🌟",
};

export async function handleStar(payload: any): Promise<void> {
  const { action, sender, repository } = payload;

  if (action !== "created") return;

  const totalStars: number = repository.stargazers_count;
  const isMilestone = MILESTONES.includes(totalStars);

  if (isMilestone) {
    await sendDiscordEmbed({
      title: `🎉 Milestone reached! ${totalStars} stars`,
      description: MILESTONE_MESSAGES[totalStars],
      url: repository.html_url,
      color: 0xf5c518, // dorado
      author: {
        name: sender.login,
        url: sender.html_url,
        icon_url: sender.avatar_url,
      },
      footer: {
        text: `${repository.full_name} · ${totalStars} ⭐`,
        icon_url: "https://github.githubassets.com/favicons/favicon.png",
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  await sendDiscordEmbed({
    title: `⭐ New star`,
    description: `**${sender.login}** starred the repo. Total: **${totalStars} ⭐**`,
    url: repository.html_url,
    color: 0x7f77dd, // purple React Dojo
    author: {
      name: sender.login,
      url: sender.html_url,
      icon_url: sender.avatar_url,
    },
    footer: {
      text: repository.full_name,
      icon_url: "https://github.githubassets.com/favicons/favicon.png",
    },
    timestamp: new Date().toISOString(),
  });
}
