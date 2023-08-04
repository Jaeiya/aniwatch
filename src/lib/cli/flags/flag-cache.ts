import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import { Log, Printer } from '../../printer/printer.js';
import { Config } from '../../config.js';

export class CacheFlag extends CLIFlag {
    name: CLIFlagName = ['c', 'cache'];
    type: CLIFlagType = 'multiArg';

    helpAliases: string[] = [
        ...this.name,
        'display cache',
        'show cache',
        'get cache',
        'lookup cache',
        'list cache',
        'rebuild cache',
        'reload cache',
        'load cache',
    ];

    shortHelpDisplay = 'Displays all currently Cached information.';

    getHelpLogs(): Log[] {
        return [
            ['h1', ['Cache']],
            [
                'p',
                'This flag allows you to display a list of all anime within your cache ' +
                    'or rebuild the cache from your Kitsu watch list.',
            ],
            null,
        ];
    }

    getSyntaxHelpLogs(): Log[] | null {
        return [
            ['h2', ['Syntax']],
            ['s', ['c', 'cache'], '<info|rebuild>'],
            null,
            ['h2', ['Details']],
            ['d', ['info', 'List all anime within the cache.'], 3],
            null,
            ['d', ['rebuild', 'Re-build cache from your Kitsu watch list.']],
            null,
            ['h2', ['Examples']],
            ['e', ['c', 'info']],
            ['e', ['c', 'rebuild']],
            ['e', ['cache', 'info']],
            ['e', ['cache', 'rebuild']],
        ];
    }

    exec() {
        const [arg] = CLI.nonFlagArgs;
        const hasValidArgs = CLI.validateSingleArg({
            args: ['info', 'rebuild'],
            flag: this,
        });

        if (hasValidArgs) {
            if (arg == 'info') {
                return showCacheInfo();
            }

            if (arg == 'rebuild') {
                return rebuildCache();
            }
        }
    }
}

function showCacheInfo() {
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

async function rebuildCache() {
    const stopLoader = Printer.printLoader('Rebuilding Cache');
    const { cachedAnimeCount } = await Kitsu.rebuildCache();
    stopLoader();
    Printer.printInfo(`;bg;${cachedAnimeCount} ;g;Anime Reloaded`, 'Success', 3);
}
