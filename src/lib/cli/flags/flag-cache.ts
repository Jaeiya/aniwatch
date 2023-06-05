import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import { Log } from '../../printer/printer.js';

export class CacheFlag extends CLIFlag {
    name: CLIFlagName = ['c', 'cache'];
    type: CLIFlagType = 'simple';

    helpAliases: string[] = [
        ...this.name,
        'display cache',
        'show cache',
        'get cache',
        'lookup cache',
        'list cache',
    ];

    shortHelpDisplay = 'Displays all currently Cached information.';

    getHelpLogs(): Log[] {
        return [
            ['h1', ['Display Cache']],
            ['p', 'This flag allows you to display the currently saved cache information.'],
            null,
        ];
    }

    exec = Kitsu.displayCacheInfo;
}
