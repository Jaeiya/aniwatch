import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import { Log, Printer } from '../../printer/printer.js';
import { Config } from '../../config.js';

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

    exec(): void | Promise<void> {
        const cache = Kitsu.animeCache;
        const fileBindingCount = Config.getKitsuProp('fileBindings').length;

        Printer.print([
            null,
            null,
            ['h3', ['Anime Cache Info']],
            null,
            ['py', ['Cached Anime', `;m;${cache.length}`], 1],
            ['py', ['File Bindings', `;m;${fileBindingCount}`]],
            null,
            ['h3', ['Cached Anime']],
            ['hl', 'bk', 70],
        ]);

        for (const c of cache) {
            Printer.print([
                ['py', ['id', `;y;${c.libID}`], 6],
                ['py', ['title_jp', `${c.jpTitle}`]],
                ['py', ['title_en', `${c.enTitle}`]],
                ['py', ['Progress', `;g;${c.epProgress} ;by;/ ;m;${c.epCount || 'Unknown'}`]],
                ['', `;c;link: ;x;https://kitsu.io/anime/${c.slug}`, 7],
                ['hl', 'bk', 70],
            ]);
        }
    }
}
