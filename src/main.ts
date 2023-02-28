#!/usr/bin/env node
import './globals.js';
import { CLI } from './lib/cli/cli.js';
import { Kitsu } from './lib/kitsu/kitsu.js';
import { isDev } from './lib/utils.js';
import { ConsoleLogger } from './lib/logger.js';
import { flags } from './lib/cli/flags/flags.js';

console.log('');

if (isDev()) {
    const smp = await import('source-map-support');
    smp.default.install();
    ConsoleLogger.info('TypeScript source map support installed');
}

process.removeAllListeners('warning');

await Kitsu.init();

for (const flag of flags) {
    CLI.addFlag(new flag());
}

await CLI.tryExecFlags();
