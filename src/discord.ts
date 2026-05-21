// src/discord.ts
interface DiscordEmbed {
  title: string;
  description?: string;
  url?: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
  author?: { name: string; url?: string; icon_url?: string };
  thumbnail?: { url: string };
}

export async function sendDiscordEmbed(embed: DiscordEmbed): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL!;

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "React Dojo Bot",
      avatar_url: "https://react-dojo.vercel.app/logo-clean.png",
      embeds: [embed],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Discord error ${res.status}:`, err);
    throw new Error(`Discord webhook failed: ${res.status}`);
  }
}
