#!/usr/bin/env node
import { CLI } from './lib/cli/cli.js';
import { Kitsu } from './lib/kitsu/kitsu.js';
import { Logger } from './lib/logger.js';
import { isDev } from './lib/utils.js';
import { ProfileFlag } from './lib/cli/flags/flag-profile.js';
import { HelpFlag } from './lib/cli/flags/flag-help.js';
import { RebuildProfileFlag } from './lib/cli/flags/flag-rebuild-profile.js';
import { CacheFlag } from './lib/cli/flags/flag-cache.js';
import { RebuildCacheFlag } from './lib/cli/flags/flag-rebuild-cache.js';
import { FindAnimeFlag } from './lib/cli/flags/flag-find-anime.js';
import { RSSFeedFlag } from './lib/cli/flags/flag-rss-feed.js';
import { RefreshTokenFlag } from './lib/cli/flags/flag-refresh-token.js';
import { DefaultFlag } from './lib/cli/flags/flag-default.js';
import { DirInfoFlag } from './lib/cli/flags/flag-dir-size.js';

console.log('');
if (isDev()) {
  const smp = await import('source-map-support');
  smp.default.install();
  Logger.info('TypeScript source map support installed');
}

process.removeAllListeners('warning');

await Kitsu.init();

CLI.addFlag(new DefaultFlag());
CLI.addFlag(new ProfileFlag());
CLI.addFlag(new RebuildProfileFlag());
CLI.addFlag(new CacheFlag());
CLI.addFlag(new RebuildCacheFlag());
CLI.addFlag(new RefreshTokenFlag());
CLI.addFlag(new HelpFlag());
CLI.addFlag(new FindAnimeFlag());
CLI.addFlag(new RSSFeedFlag());
CLI.addFlag(new DirInfoFlag());

await CLI.tryExecFlags();
