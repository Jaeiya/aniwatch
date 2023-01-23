#!/usr/bin/env node
import { CLI } from './lib/cli.js';
import { KitsuAPI } from './lib/kitsu/kitsu.js';
import { Logger } from './lib/logger.js';
import { isDev, pathResolve } from './lib/utils.js';
import { watchAnime } from './lib/watch.js';

console.log('');
process.removeAllListeners('warning');
const _cc = Logger.consoleColors;

// TODO - Add full Kitsu support for incrementing progress and finding anime
// https://kitsu.docs.apiary.io/

const _workingDir = isDev() ? pathResolve('E:/downloads/anime') : process.cwd();
const k = new KitsuAPI();
await k.init();

if (CLI.tryFlag('reload-cache')) {
  k.reloadAnimeCache();
} else if (CLI.tryFlag('profile')) {
  k.displayUserProfile();
} else if (CLI.tryFlag('cache')) {
  k.displayCacheInfo();
} else if (CLI.tryFlag('find-anime')) {
  const animeList = k.findAnime(CLI.flagArgs[0]);
  animeList.forEach((anime) => {
    console.log(anime[1]);
  });
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
