// src/digest.ts
import { sendDiscordEmbed } from "./discord.ts";

const GITHUB_REPO = process.env.GITHUB_REPO ?? "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

async function githubFetch(path: string): Promise<any> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (GITHUB_TOKEN) headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;

  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${path}`);
  return res.json();
}

function weekAgoISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

export async function sendWeeklyDigest(): Promise<void> {
  if (!GITHUB_REPO) {
    console.warn("GITHUB_REPO not set, skipping digest");
    return;
  }

  const since = weekAgoISO();
  const weekAgo = new Date(since);
  const repoName = GITHUB_REPO.split("/")[1];

  const [commits, pullRequests, closedIssues, openedIssues, repoData] = await Promise.all([
    githubFetch(`/repos/${GITHUB_REPO}/commits?since=${since}&per_page=100`),
    githubFetch(`/repos/${GITHUB_REPO}/pulls?state=closed&sort=updated&direction=desc&per_page=50`),
    githubFetch(`/repos/${GITHUB_REPO}/issues?state=closed&since=${since}&per_page=50`),
    githubFetch(`/repos/${GITHUB_REPO}/issues?state=open&since=${since}&per_page=50`),
    githubFetch(`/repos/${GITHUB_REPO}`),
  ]);

  const merged = pullRequests.filter(
    (pr: any) => pr.merged_at && new Date(pr.merged_at) >= weekAgo
  );
  const closed = closedIssues.filter((i: any) => !i.pull_request);
  const opened = openedIssues.filter((i: any) => !i.pull_request);

  // Top 5 contributors by commit count
  const authorMap: Record<string, number> = {};
  for (const commit of commits) {
    const login = commit.author?.login ?? commit.commit.author.name;
    authorMap[login] = (authorMap[login] ?? 0) + 1;
  }
  const topContributors = Object.entries(authorMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([login, count], i) => {
      const medal = ["🥇", "🥈", "🥉"][i] ?? "▪️";
      return `${medal} **${login}** — ${count} commit${count > 1 ? "s" : ""}`;
    })
    .join("\n") || "*No commits this week*";

  const dateRange = `${weekAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  await sendDiscordEmbed({
    title: `📊 Weekly Digest — ${repoName}`,
    description: `Activity summary for **${dateRange}**`,
    url: `https://github.com/${GITHUB_REPO}`,
    color: 0x7f77dd,
    fields: [
      { name: "Commits",        value: `\`${commits.length}\``,        inline: true },
      { name: "PRs Merged",     value: `\`${merged.length}\``,         inline: true },
      { name: "Issues Closed",  value: `\`${closed.length}\``,         inline: true },
      { name: "Issues Opened",  value: `\`${opened.length}\``,         inline: true },
      { name: "Total Stars",    value: `\`${repoData.stargazers_count} ⭐\``, inline: true },
      { name: "Open Issues",    value: `\`${repoData.open_issues_count}\``,   inline: true },
      { name: "Top Contributors", value: topContributors, inline: false },
    ],
    footer: {
      text: GITHUB_REPO,
      icon_url: "https://github.githubassets.com/favicons/favicon.png",
    },
    timestamp: new Date().toISOString(),
  });

  console.log("Weekly digest sent successfully");
}
