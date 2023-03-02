#!/usr/bin/env node
import './globals.js';
import { CLI } from './lib/cli/cli.js';
import { Kitsu } from './lib/kitsu/kitsu.js';
import { isDev } from './lib/utils.js';
import { ConsoleLogger } from './lib/logger.js';
import { Flags } from './lib/cli/flags/flags.js';
import { Config } from './lib/config.js';

console.log('');

if (isDev()) {
    const smp = await import('source-map-support');
    smp.default.install();
    ConsoleLogger.info('TypeScript source map support installed');
}

await Config.init();

process.removeAllListeners('warning');

for (const Flag of Flags) {
    CLI.addFlag(new Flag());
}

await CLI.tryExecFlags();
