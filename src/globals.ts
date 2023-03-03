import { Config } from './lib/config.js';
import { Kitsu } from './lib/kitsu/kitsu.js';
import { ConsoleLogger } from './lib/logger.js';

// Fetch creates a warning
process.removeAllListeners('warning');
global._con = ConsoleLogger;

await Config.init({
    setupNewConfig: async () => {
        _con.info(`;bc;Working Directory: ;g;${process.cwd()}`);
        await Kitsu.init();
        Config.set('useColor', true);
        _con.showColor = Config.get('useColor');
    },
    setDefaultProps: (config) => {
        config.useColor ??= false;
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
