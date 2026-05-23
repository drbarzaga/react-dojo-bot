import { sendDiscordEmbed } from "../discord.ts";

const MILESTONES = [1, 5, 10, 25, 50, 100, 250, 500, 1000];

const MILESTONE_MESSAGES: Record<number, string> = {
  1:    "First fork — someone is building on the dojo 🍴",
  5:    "5 forks — the idea is spreading 🌿",
  10:   "10 forks — double digits, people are serious 💡",
  25:   "25 forks — a real ecosystem forming 🌐",
  50:   "50 forks — React Dojo is a foundation 🏗️",
  100:  "100 forks — a hundred builders trust the dojo 🔨",
  250:  "250 forks — serious traction in the community 🚀",
  500:  "500 forks — half a thousand builders strong 💪",
  1000: "1,000 forks — React Dojo is a platform 👑",
};

export async function handleFork(payload: any): Promise<void> {
  const { forkee, sender, repository } = payload;

  const totalForks: number = repository.forks_count;
  const isMilestone = MILESTONES.includes(totalForks);

  if (isMilestone) {
    await sendDiscordEmbed({
      title: `🎉 Fork milestone! ${totalForks} forks`,
      description: MILESTONE_MESSAGES[totalForks],
      url: forkee.html_url,
      color: 0x1d9e75,
      author: {
        name: sender.login,
        url: sender.html_url,
        icon_url: sender.avatar_url,
      },
      footer: {
        text: `${repository.full_name} · ${totalForks} 🍴`,
        icon_url: "https://github.githubassets.com/favicons/favicon.png",
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  await sendDiscordEmbed({
    title: `🍴 New fork`,
    description: `**${sender.login}** forked the repo. Total: **${totalForks} 🍴**`,
    url: forkee.html_url,
    color: 0x7f77dd,
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
