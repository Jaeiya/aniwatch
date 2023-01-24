#!/usr/bin/env node
import { CLI } from './lib/cli.js';
import { KitsuAPI } from './lib/kitsu/kitsu.js';
import { Logger } from './lib/logger.js';
import { isDev, pathResolve } from './lib/utils.js';
import { watchAnime } from './lib/watch.js';
import * as rss from './lib/rss.js';

console.log('');
process.removeAllListeners('warning');
const _cc = Logger.consoleColors;

const _workingDir = isDev() ? pathResolve('E:/downloads/anime') : process.cwd();
const k = new KitsuAPI();
await k.init();

if (CLI.tryFlag('rebuild-cache')) {
  k.rebuildCache();
} else if (CLI.tryFlag('profile')) {
  k.displayUserProfile();
} else if (CLI.tryFlag('display-cache')) {
  k.displayCacheInfo();
} else if (CLI.tryFlag('find-anime')) {
  const animeList = k.findAnime(CLI.flagArgs[0]);
  animeList.forEach((anime) => {
    Logger.chainInfo([
      `${_cc.bcn}title_jp: ${_cc.x}${anime[0]}`,
      `${_cc.bcn}title_en: ${_cc.x}${anime[1]}`,
      '',
    ]);
  });
} else if (CLI.tryFlag('rss-feed')) {
  const result = await rss.getFansubRSS(CLI.flagArgs[0]);
  Logger.chainInfo([
    `${_cc.bcn}Entry Count: ${_cc.gn}${result.entryCount}`,
    `${_cc.bcn}Latest: ${_cc.yw}${result.latestTitle}`,
    `${_cc.bcn}RSS: ${_cc.x}${result.rss}`,
  ]);
} else if (!CLI.getAllFlags().length) {
  if (CLI.flagArgs.length < 2 || CLI.flagArgs.length > 3) {
    Logger.error('Please provide an anime name and episode number to watch.');
    Logger.error(
      `Example: ${_cc.byw}aniwatch${_cc.x} ${_cc.bcn}<name> <episode_num> <forced_ep_num>`
    );
    process.exit(1);
  }
  watchAnime(CLI.flagArgs[0], [CLI.flagArgs[1], CLI.flagArgs[2] || ''], _workingDir, k);
}
