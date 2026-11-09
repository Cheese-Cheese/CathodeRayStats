export interface ScreenPalette {
  primary: string;    // Main text, bars, active stats
  bright: string;     // Headers, glowing accents, level 4 activity
  dim: string;        // Inactive scanlines, dividers, secondary labels
  bg: string;         // CRT phosphor glass background
}

export interface TVCabinetPalette {
  body: string;       // Outer TV chassis fill
  bezelDark: string;  // Deep recessed inner bezel & shadow
  bezelLight: string; // Top/left bevel highlight
  labelColor: string; // Dial and brand badge text color
}

export interface ThemeConfig {
  screen: ScreenPalette;
  tv: TVCabinetPalette;
  tvStyle: 'classic' | 'trinitron';
  showAntennas: boolean;
  channelDuration: number;
  channel: 'all' | '1' | '2' | '3' | '4';
  username: string;
  badgeLabel?: string;
  knobType?: 'line' | 'dot';
}

export interface LanguageStat {
  name: string;
  percentage: number;
  color?: string;
}

export interface FeaturedRepo {
  name: string;
  description: string;
  stars: number;
  forks: number;
  primaryLanguage?: string;
}

export interface ContributionDay {
  contributionCount: number;
  contributionLevel: 'NONE' | 'FIRST_QUARTILE' | 'SECOND_QUARTILE' | 'THIRD_QUARTILE' | 'FOURTH_QUARTILE';
  date: string;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface UserStats {
  username: string;
  name?: string;
  totalContributions: number;
  totalCommits: number;
  totalPullRequests: number;
  followers: number;
  languages: LanguageStat[];
  featuredRepo: FeaturedRepo;
  activityWeeks: ContributionWeek[];
}

export interface ActionInputs {
  username: string;
  tvColor: string;
  screenColor: string;
  tvStyle: 'classic' | 'trinitron';
  showAntennas: boolean;
  featuredRepo: string;
  channelDuration: number;
  channel: 'all' | '1' | '2' | '3' | '4';
  outputPath: string;
  timezoneOffsetMinutes: number;
  githubToken: string;
  commitAndPush: boolean;
  badgeLabel?: string;
  knobType?: 'line' | 'dot';
}
