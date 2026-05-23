// src/handlers/release.ts
import { sendDiscordEmbed } from "../discord.ts";

export async function handleRelease(payload: any): Promise<void> {
  const { action, release, repository } = payload;

  if (action !== "published") return;

  const body = release.body
    ? release.body.slice(0, 300) + (release.body.length > 300 ? "..." : "")
    : "*No release notes*";

  await sendDiscordEmbed({
    title: `🚀 New release: ${release.tag_name}`,
    description: body,
    url: release.html_url,
    color: 0x1d9e75,
    author: {
      name: release.author.login,
      url: release.author.html_url,
      icon_url: release.author.avatar_url,
    },
    fields: [
      { name: "Name",        value: release.name || release.tag_name, inline: true },
      { name: "Tag",         value: `\`${release.tag_name}\``,        inline: true },
      { name: "Pre-release", value: release.prerelease ? "Yes" : "No", inline: true },
    ],
    footer: {
      text: repository.full_name,
      icon_url: "https://github.githubassets.com/favicons/favicon.png",
    },
    timestamp: new Date().toISOString(),
  });
}
