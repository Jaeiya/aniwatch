#!/usr/bin/env node
import { Logger } from './lib/logger.js';
import { isDev, pathResolve } from './lib/utils.js';
import { watchAnime } from './lib/watch.js';

console.log('');

// Set stack traces to use typescript source files
if (isDev()) {
  const smp = await import('source-map-support');
  smp.default.install();
  Logger.info('TypeScript source map support installed');
}

const [, , _episodeName, _episodeNumber] = process.argv;

const _workingDir = isDev() ? pathResolve('E:/downloads/anime') : process.cwd();
watchAnime(_episodeName, _episodeNumber, _workingDir);
