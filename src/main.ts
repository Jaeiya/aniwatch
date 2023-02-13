#!/usr/bin/env node
import CLI from './lib/cli.js';
import K from './lib/kitsu/kitsu.js';
import { Logger } from './lib/logger.js';
import { isDev, pathResolve } from './lib/utils.js';
import { watchAnime } from './lib/watch.js';
import help from './lib/help.js';
import { ProfileFlag } from './lib/cli/flag-profile.js';
import { HelpFlag } from './lib/cli/flag-help.js';
import { RebuildProfileFlag } from './lib/cli/flag-rebuild-profile.js';
import { CacheFlag } from './lib/cli/flag-cache.js';
import { RebuildCacheFlag } from './lib/cli/flag-rebuild-cache.js';
import { FindAnimeFlag } from './lib/cli/flag-find-anime.js';
import { RSSFeedFlag } from './lib/cli/flag-rss-feed.js';
import { RefreshTokenFlag } from './lib/cli/flag-refresh-token.js';

console.log('');
if (isDev()) {
  const smp = await import('source-map-support');
  smp.default.install();
  Logger.info('TypeScript source map support installed');
}

process.removeAllListeners('warning');
const _cc = Logger.consoleColors;

const _workingDir = isDev() ? pathResolve('E:/downloads/anime') : process.cwd();
await K.init();

CLI.addFlag(new ProfileFlag());
CLI.addFlag(new HelpFlag());
CLI.addFlag(new RebuildProfileFlag());
CLI.addFlag(new CacheFlag());
CLI.addFlag(new RebuildCacheFlag());
CLI.addFlag(new FindAnimeFlag());
CLI.addFlag(new RSSFeedFlag());
CLI.addFlag(new RefreshTokenFlag());

if (!(await CLI.tryExecFlags())) {
  execWatchAnime();
}

function execWatchAnime() {
  const flagArgs = CLI.nonFlagArgs;
  if (!CLI.userArgs.length && K.isFirstSetup) {
    return;
  }
  if (flagArgs.length < 2 || flagArgs.length > 3) {
    Logger.chainError([
      `${_cc.rd}Invalid Syntax`,
      'Read the help below to learn the correct syntax:',
      '',
    ]);
    help.displayDefaultSyntax();
    process.exit(1);
  }
  watchAnime(flagArgs[0], [flagArgs[1], flagArgs[2] || ''], _workingDir);
}
