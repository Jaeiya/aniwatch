import { Help } from '../../help.js';
import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';

const { h1, nl } = Help.display;

export class RebuildCacheFlag implements CLIFlag {
    name: CLIFlagName = ['rc', 'rebuild-cache'];
    type: CLIFlagType = 'simple';

    helpAliases: string[] = [...this.name, 'rebuild cache', 'reload cache', 'load cache'];

    shortHelpDisplay = 'Rebuilds your cache data from Kitsu.';

    helpDisplay: string[] = [
        h1(`Rebuild Cache`),
        nl(`Rebuilds your cache data from Kitsu. This is`),
        nl(`;m;necessary ;bk;whenever you update your Kitsu watch`),
        nl(`list, using the https://kitsu.io website.`),
        '',
    ];

    exec() {
        _con.chainInfo(['', ';bm;... Rebuild Cache ...']);
        Kitsu.rebuildCache();
    }
}
