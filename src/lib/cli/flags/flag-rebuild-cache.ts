import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import { Log } from '../../printer/printer.js';

export class RebuildCacheFlag extends CLIFlag {
    name: CLIFlagName = ['rc', 'rebuild-cache'];
    type: CLIFlagType = 'simple';

    helpAliases: string[] = [...this.name, 'rebuild cache', 'reload cache', 'load cache'];

    shortHelpDisplay = 'Rebuilds your cache data from Kitsu.';

    getHelpLogs(): Log[] {
        return [
            ['h1', ['Rebuild Cache']],
            [
                'p',
                'Rebuilds your cache data from Kitsu. This is ;m;necessary ;bk;whenever ' +
                    'you update your Kitsu watch list, using the https://kitsu.io website',
            ],
            null,
        ];
    }

    exec() {
        _con.chainInfo(['', ';bm;... Rebuild Cache ...']);
        Kitsu.rebuildCache();
    }
}
