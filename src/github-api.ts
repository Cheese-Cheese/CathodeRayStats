import { UserStats, LanguageStat, FeaturedRepo, ContributionWeek, ContributionDay } from './types';

/**
 * Creates deterministic mock user data for offline development or testing.
 */
export function createMockStats(username: string, featuredRepoName?: string, timezoneOffsetMinutes: number = 0): UserStats {
  const weeks: ContributionWeek[] = [];
  const now = new Date();
  const today = new Date(now.getTime() + timezoneOffsetMinutes * 60 * 1000);
  
  // Build 26 weeks of contribution history
  for (let w = 25; w >= 0; w--) {
    const days: ContributionDay[] = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - (w * 7 + d));
      const dateStr = date.toISOString().split('T')[0];

      // Pseudo-random pseudo-realistic activity distribution based on day/week
      const pseudoVal = (Math.sin(w * 3 + d * 7) + 1) / 2;
      let count = 0;
      let level: ContributionDay['contributionLevel'] = 'NONE';

      if (pseudoVal > 0.82) {
        count = Math.floor(pseudoVal * 12) + 5;
        level = 'FOURTH_QUARTILE';
      } else if (pseudoVal > 0.62) {
        count = Math.floor(pseudoVal * 8) + 2;
        level = 'THIRD_QUARTILE';
      } else if (pseudoVal > 0.42) {
        count = Math.floor(pseudoVal * 4) + 1;
        level = 'SECOND_QUARTILE';
      } else if (pseudoVal > 0.25) {
        count = 1;
        level = 'FIRST_QUARTILE';
      }

      days.push({
        contributionCount: count,
        contributionLevel: level,
        date: dateStr,
      });
    }
    weeks.push({ contributionDays: days });
  }

  const defaultLanguages: LanguageStat[] = [
    { name: 'TypeScript', percentage: 46 },
    { name: 'Rust', percentage: 24 },
    { name: 'Python', percentage: 16 },
    { name: 'Go', percentage: 9 },
    { name: 'Shell', percentage: 5 },
  ];

  const defaultRepo: FeaturedRepo = {
    name: featuredRepoName || 'CathodeRayStats',
    description: 'CathodeRayStats - Animated retro CRT television SVG widget displaying live stats, languages, and activity.',
    stars: 342,
    forks: 48,
    primaryLanguage: 'TypeScript',
  };

  return {
    username,
    name: username,
    totalContributions: 2481,
    totalCommits: 1894,
    totalPullRequests: 142,
    followers: 89,
    languages: defaultLanguages,
    featuredRepo: defaultRepo,
    activityWeeks: weeks,
  };
}

/**
 * Normalizes language bytes into top 5 percentage stats.
 */
export function calculateLanguageStats(
  repoNodes: Array<{
    languages?: {
      edges?: Array<{ size: number; node: { name: string; color?: string } }>;
    };
  }>
): LanguageStat[] {
  const totals: Record<string, { size: number; color?: string }> = {};
  let overallSize = 0;

  for (const repo of repoNodes) {
    if (!repo.languages?.edges) continue;
    for (const edge of repo.languages.edges) {
      const name = edge.node.name;
      const size = edge.size;
      overallSize += size;
      if (!totals[name]) {
        totals[name] = { size: 0, color: edge.node.color };
      }
      totals[name].size += size;
    }
  }

  if (overallSize === 0) {
    return [
      { name: 'TypeScript', percentage: 50 },
      { name: 'JavaScript', percentage: 30 },
      { name: 'HTML/CSS', percentage: 20 },
    ];
  }

  const sorted = Object.entries(totals)
    .map(([name, data]) => ({
      name,
      percentage: Math.round((data.size / overallSize) * 100),
      color: data.color,
    }))
    .filter(item => item.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);

  const top5 = sorted.slice(0, 5);
  // Re-normalize top 5 to sum near 100%
  const topSum = top5.reduce((acc, curr) => acc + curr.percentage, 0);
  if (topSum > 0 && topSum < 95) {
    // Add "Other" if needed
    top5.push({ name: 'Other', percentage: 100 - topSum, color: undefined });
  }

  return top5.slice(0, 5);
}

/**
 * Fetches data via GitHub GraphQL API.
 */
export async function fetchFromGraphQL(username: string, token: string, featuredRepo?: string): Promise<UserStats> {
  const query = `
    query($username: String!) {
      user(login: $username) {
        name
        followers {
          totalCount
        }
        contributionsCollection {
          totalCommitContributions
          totalPullRequestContributions
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                contributionLevel
                date
              }
            }
          }
        }
        pinnedItems(first: 6, types: [REPOSITORY]) {
          nodes {
            ... on Repository {
              name
              description
              stargazerCount
              forkCount
              primaryLanguage {
                name
              }
            }
          }
        }
        repositories(first: 30, ownerAffiliations: OWNER, isFork: false, orderBy: {field: STARGAZERS, direction: DESC}) {
          nodes {
            name
            description
            stargazerCount
            forkCount
            primaryLanguage {
              name
            }
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              edges {
                size
                node {
                  name
                  color
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'CathodeRayStats-action',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables: { username } }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL API error: ${response.status} ${response.statusText}`);
  }

  const json: any = await response.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(`GraphQL Errors: ${json.errors.map((e: any) => e.message).join(', ')}`);
  }

  const user = json.data?.user;
  if (!user) {
    throw new Error(`User "${username}" not found on GitHub.`);
  }

  const repos = user.repositories?.nodes || [];
  const pinned = user.pinnedItems?.nodes || [];

  // Determine featured repo
  let selectedRepo: FeaturedRepo;
  if (featuredRepo) {
    const matched = repos.find((r: any) => r.name.toLowerCase() === featuredRepo.toLowerCase())
      || pinned.find((r: any) => r.name.toLowerCase() === featuredRepo.toLowerCase());
    if (matched) {
      selectedRepo = {
        name: matched.name,
        description: matched.description || '',
        stars: matched.stargazerCount,
        forks: matched.forkCount,
        primaryLanguage: matched.primaryLanguage?.name,
      };
    } else {
      selectedRepo = {
        name: featuredRepo,
        description: 'Selected featured repository',
        stars: 0,
        forks: 0,
      };
    }
  } else if (pinned.length > 0 && pinned[0]?.name) {
    selectedRepo = {
      name: pinned[0].name,
      description: pinned[0].description || '',
      stars: pinned[0].stargazerCount,
      forks: pinned[0].forkCount,
      primaryLanguage: pinned[0].primaryLanguage?.name,
    };
  } else if (repos.length > 0) {
    selectedRepo = {
      name: repos[0].name,
      description: repos[0].description || '',
      stars: repos[0].stargazerCount,
      forks: repos[0].forkCount,
      primaryLanguage: repos[0].primaryLanguage?.name,
    };
  } else {
    selectedRepo = {
      name: `${username}-profile`,
      description: 'GitHub profile activity & repositories',
      stars: 1,
      forks: 0,
    };
  }

  const langStats = calculateLanguageStats(repos);
  const calendar = user.contributionsCollection?.contributionCalendar;
  const weeks: ContributionWeek[] = calendar?.weeks || [];

  return {
    username,
    name: user.name || username,
    totalContributions: calendar?.totalContributions || 0,
    totalCommits: user.contributionsCollection?.totalCommitContributions || 0,
    totalPullRequests: user.contributionsCollection?.totalPullRequestContributions || 0,
    followers: user.followers?.totalCount || 0,
    languages: langStats,
    featuredRepo: selectedRepo,
    activityWeeks: weeks,
  };
}

/**
 * Fallback to public REST API if no token is available.
 */
export async function fetchFromRestApi(username: string, featuredRepo?: string): Promise<UserStats> {
  const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
    headers: { 'User-Agent': 'CathodeRayStats-action' },
  });

  if (!userRes.ok) {
    throw new Error(`GitHub REST user fetch error: ${userRes.status}`);
  }

  const userData: any = await userRes.json();

  const reposRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=30&sort=pushed`, {
    headers: { 'User-Agent': 'CathodeRayStats-action' },
  });

  const reposData: any[] = reposRes.ok ? await reposRes.json() : [];

  let selectedRepo: FeaturedRepo = {
    name: featuredRepo || (reposData[0]?.name ?? `${username}-repo`),
    description: reposData[0]?.description || 'Public GitHub Repository',
    stars: reposData[0]?.stargazers_count ?? 0,
    forks: reposData[0]?.forks_count ?? 0,
    primaryLanguage: reposData[0]?.language,
  };

  if (featuredRepo) {
    const matched = reposData.find(r => r.name.toLowerCase() === featuredRepo.toLowerCase());
    if (matched) {
      selectedRepo = {
        name: matched.name,
        description: matched.description || '',
        stars: matched.stargazers_count ?? 0,
        forks: matched.forks_count ?? 0,
        primaryLanguage: matched.language,
      };
    }
  }

  // Generate fallback weeks & languages
  const mockFallback = createMockStats(username, selectedRepo.name);

  return {
    ...mockFallback,
    name: userData.name || username,
    followers: userData.followers || 0,
    featuredRepo: selectedRepo,
  };
}

/**
 * Main data fetcher orchestrator.
 */
export async function fetchGitHubData(
  username: string,
  token?: string,
  featuredRepo?: string,
  timezoneOffsetMinutes: number = 0
): Promise<UserStats> {
  if (token && token.trim().length > 0) {
    try {
      return await fetchFromGraphQL(username, token, featuredRepo);
    } catch (err) {
      console.warn(`[WARN] GraphQL fetch failed (${(err as Error).message}), attempting REST fallback...`);
    }
  }

  try {
    return await fetchFromRestApi(username, featuredRepo);
  } catch (err) {
    console.warn(`[WARN] REST fetch failed (${(err as Error).message}), using deterministic mock data...`);
    return createMockStats(username, featuredRepo, timezoneOffsetMinutes);
  }
}
