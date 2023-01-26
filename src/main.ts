#!/usr/bin/env node
import CLI from './lib/cli.js';
import { KitsuAPI } from './lib/kitsu/kitsu.js';
import { Logger } from './lib/logger.js';
import { isDev, pathResolve } from './lib/utils.js';
import { watchAnime } from './lib/watch.js';
import * as rss from './lib/rss.js';
import help from './lib/help.js';

console.log('');
if (isDev()) {
  const smp = await import('source-map-support');
  smp.default.install();
  Logger.info('TypeScript source map support installed');
}

process.removeAllListeners('warning');
const _cc = Logger.consoleColors;

const _workingDir = isDev() ? pathResolve('E:/downloads/anime') : process.cwd();
const k = new KitsuAPI();
await k.init();

if (CLI.tryRebuildCacheFlag()) {
  k.rebuildCache();
} else if (CLI.tryProfileFlag()) {
  k.displayUserProfile();
} else if (CLI.tryCacheFlag()) {
  k.displayCacheInfo();
} else if (CLI.tryFindAnimeFlag()) {
  await findAnime();
} else if (CLI.tryHelpFlag()) {
  help.displayFullHelp();
} else if (CLI.tryRSSFlag()) {
  await getRSSFeedInfo();
} else {
  if (CLI.flagArgs.length) {
    Logger.error(`${_cc.rd}Flag Not Found`);
    Logger.error(`Check the Help below for valid flag usage!`);
    if (CLI.nonFlagArgs.length > 0) {
      help.displayComplexFlagHelp();
    } else {
      help.displayFlagHelp();
    }
  } else {
    execWatchAnime();
  }
}

async function findAnime() {
  const animeList = await k.findAnime(CLI.nonFlagArgs.join(' '));
  animeList.forEach((anime) => {
    const totalEps = anime.totalEpisodes ? anime.totalEpisodes : `${_cc.rd}unknown`;
    Logger.chainInfo([
      `${_cc.bcn}Title JP: ${_cc.x}${anime.title_jp}`,
      `${_cc.bcn}Title EN: ${_cc.x}${anime.title_en}`,
      `${_cc.bcn}Progress: ${_cc.gn}${anime.progress}${_cc.byw} / ${_cc.ma}${totalEps}`,
      `${_cc.bcn}My Rating: ${_cc.gn}${anime.rating ? anime.rating : 'Not Rated'}`,
      `${_cc.bcn}Avg. Rating: ${_cc.gn}${anime.avgRating}`,
    ]);
  });
}

async function getRSSFeedInfo() {
  const result = await rss.getFansubRSS(CLI.nonFlagArgs.join(' '));
  Logger.chainInfo([
    `${_cc.bcn}Entry Count: ${_cc.gn}${result.entryCount}`,
    `${_cc.bcn}Latest: ${_cc.yw}${result.latestTitle}`,
    `${_cc.bcn}RSS: ${_cc.x}${result.rss}`,
  ]);
}

function execWatchAnime() {
  const flagArgs = CLI.nonFlagArgs;
  if (!CLI.userArgs.length && k.isFirstSetup) {
    return;
  }
  if (flagArgs.length < 2 || flagArgs.length > 3) {
    Logger.error('Invalid Syntax');
    Logger.chainInfo(['', ...help.getDefaultHelp()]);
    process.exit(1);
  }
  watchAnime(flagArgs[0], [flagArgs[1], flagArgs[2] || ''], _workingDir, k);
}
