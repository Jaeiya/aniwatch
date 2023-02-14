#!/usr/bin/env node
import { CLI } from './lib/cli.js';
import K from './lib/kitsu/kitsu.js';
import { Logger } from './lib/logger.js';
import { isDev } from './lib/utils.js';
import { ProfileFlag } from './lib/cli/flag-profile.js';
import { HelpFlag } from './lib/cli/flag-help.js';
import { RebuildProfileFlag } from './lib/cli/flag-rebuild-profile.js';
import { CacheFlag } from './lib/cli/flag-cache.js';
import { RebuildCacheFlag } from './lib/cli/flag-rebuild-cache.js';
import { FindAnimeFlag } from './lib/cli/flag-find-anime.js';
import { RSSFeedFlag } from './lib/cli/flag-rss-feed.js';
import { RefreshTokenFlag } from './lib/cli/flag-refresh-token.js';
import { DefaultFlag } from './lib/cli/flag-default.js';

console.log('');
if (isDev()) {
  const smp = await import('source-map-support');
  smp.default.install();
  Logger.info('TypeScript source map support installed');
}

process.removeAllListeners('warning');

await K.init();

CLI.addFlag(new DefaultFlag());
CLI.addFlag(new ProfileFlag());
CLI.addFlag(new RebuildProfileFlag());
CLI.addFlag(new CacheFlag());
CLI.addFlag(new RebuildCacheFlag());
CLI.addFlag(new RefreshTokenFlag());
CLI.addFlag(new HelpFlag());
CLI.addFlag(new FindAnimeFlag());
CLI.addFlag(new RSSFeedFlag());

await CLI.tryExecFlags();
