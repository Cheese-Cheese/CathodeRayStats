import * as fs from 'fs';
import * as path from 'path';
import { fetchGitHubData } from './github-api';
import { renderRetroTvSvg } from './svg-renderer';
import { resolveScreenPalette, resolveTVPalette } from './themes';
import { ThemeConfig } from './types';

async function main() {
  console.log('[INIT] CathodeRayStats Generator starting...');

  // Parse Action Inputs from environment variables
  const username = process.env.INPUT_USERNAME?.trim()
    || process.env.GITHUB_REPOSITORY_OWNER
    || process.env.GITHUB_ACTOR
    || 'Cheese-Cheese';

  const rawTvColor = process.env.INPUT_TV_COLOR?.trim() || 'charcoal';
  const rawScreenColor = process.env.INPUT_SCREEN_COLOR?.trim() || 'white';
  const rawTvStyle = (process.env.INPUT_TV_STYLE?.trim().toLowerCase() === 'trinitron') ? 'trinitron' : 'classic';
  const showAntennas = process.env.INPUT_SHOW_ANTENNAS?.trim().toLowerCase() === 'true';
  const featuredRepo = process.env.INPUT_FEATURED_REPO?.trim() || undefined;

  const durationInput = parseInt(process.env.INPUT_CHANNEL_DURATION || '4', 10);
  const channelDuration = isNaN(durationInput) || durationInput <= 0 ? 4 : durationInput;

  const rawChannel = process.env.INPUT_CHANNEL?.trim().toLowerCase() || 'all';
  const validChannels = ['all', '1', '2', '3', '4'];
  const channel = (validChannels.includes(rawChannel) ? rawChannel : 'all') as ThemeConfig['channel'];

  const rawKnobType = process.env.INPUT_KNOB_TYPE?.trim().toLowerCase();
  const knobType: 'line' | 'dot' = rawKnobType === 'dot' ? 'dot' : 'line';

  const badgeLabel = process.env.INPUT_BADGE_LABEL?.trim();
  const outputPath = process.env.INPUT_OUTPUT_PATH?.trim() || 'dist/retro-tv.svg';
  const token = process.env.GITHUB_TOKEN?.trim() || process.env.INPUT_GITHUB_TOKEN?.trim();
  const timezoneOffsetMinutes = parseInt(process.env.INPUT_TIMEZONE_OFFSET || '0', 10) || 0;

  console.log(`[CFG] Target User: ${username}`);
  console.log(`[CFG] Screen Phosphor: ${rawScreenColor} | TV Cabinet: ${rawTvColor} | Style: ${rawTvStyle}`);
  console.log(`[CFG] Antennas: ${showAntennas} | Active Channel: ${channel} | Duration: ${channelDuration}s | Knob: ${knobType}`);
  console.log(`[CFG] Output Destination: ${outputPath} | Timezone Offset: ${timezoneOffsetMinutes}m`);

  // Resolve Themes
  const screenPalette = resolveScreenPalette(rawScreenColor);
  const tvPalette = resolveTVPalette(rawTvColor);

  const themeConfig: ThemeConfig = {
    screen: screenPalette,
    tv: tvPalette,
    tvStyle: rawTvStyle,
    showAntennas,
    channelDuration,
    channel,
    username,
    badgeLabel,
    knobType,
  };

  // Fetch GitHub User Data
  console.log(`[DATA] Fetching profile stats for @${username}...`);
  const userStats = await fetchGitHubData(username, token, featuredRepo, timezoneOffsetMinutes);
  console.log(`[DATA] Stats loaded: ${userStats.totalContributions} contributions, ${userStats.languages.length} languages, repo "${userStats.featuredRepo.name}"`);

  // Render SVG
  console.log('[RENDER] Generating CRT animated SVG...');
  const svg = renderRetroTvSvg(userStats, themeConfig);

  // Write Output
  const absoluteOut = path.resolve(process.cwd(), outputPath);
  const outDir = path.dirname(absoluteOut);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(absoluteOut, svg, 'utf8');
  console.log(`[DONE] Successfully generated CathodeRayStats SVG at: ${outputPath} (${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB)`);
}

main().catch(err => {
  console.error('[FAIL] Error executing CathodeRayStats Generator:', err);
  process.exit(1);
});
