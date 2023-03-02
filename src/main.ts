#!/usr/bin/env node
import './globals.js';
import { CLI } from './lib/cli/cli.js';
import { Flags } from './lib/cli/flags/flags.js';
import { Config } from './lib/config.js';
import { Kitsu } from './lib/kitsu/kitsu.js';

await Config.init({
    setupNewConfig: async () => {
        _con.info(`;bc;Working Directory: ;g;${process.cwd()}`);
        await Kitsu.init();
    },
    setDefaultProps: (config) => {
        if (config.kitsu) {
            config.kitsu.cache ??= [];
        }
        if (config.kitsu?.stats) {
            config.kitsu.stats.secondsSpentWatching ??= 0;
            config.kitsu.stats.completedSeries ??= 0;
        }
        return config;
    },
});

for (const Flag of Flags) {
    CLI.addFlag(new Flag());
}

await CLI.tryExecFlags();
