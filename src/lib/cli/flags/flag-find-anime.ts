import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import { SerializedAnime } from '../../kitsu/kitsu-types.js';
import { Log, Printer } from '../../printer/printer.js';

export class FindAnimeFlag extends CLIFlag {
    name: CLIFlagName = ['f', 'find-anime'];
    type: CLIFlagType = 'multiArg';

    helpAliases: string[] = [
        ...this.name,
        'find anime',
        'get anime',
        'lookup anime',
        'search anime',
    ];

    getHelpLogs(): Log[] {
        return [
            ['h1', ['Find Anime']],
            [
                'p',
                'This flag allows you to lookup an anime that already exists in your ' +
                    'Kitsu ;x;Currently Watching ;bk;list, which is cached on your disk.',
            ],
            null,
            [
                'p',
                ';m;NOTE: ;bk;If the anime is not found, either it was typed incorrectly ' +
                    'or it needs to be added to your watch list. If you add it to your watch ' +
                    `list, you'll need to rebuild the cache with ;c;-rc ;bk;or ` +
                    `;c;--rebuild-cache;bk;.`,
            ],
            null,
        ];
    }

    getSyntaxHelpLogs(): Log[] {
        return [
            ['h2', ['Syntax']],
            ['s', ['f', 'find-anime'], '<name>'],
            null,
            ['h2', ['Details']],
            [
                'd',
                ['name', 'The name of any anime in your "currently watching" list on Kitsu.'],
            ],
            null,
            ['h2', ['Examples']],
            ['e', ['f', 'boku no hero']],
            ['e', ['find-anime', 'boku no hero']],
        ];
    }

    async exec(cli: typeof CLI) {
        displayAnimeList(await getAnimeList(cli));
        Printer.print([null]);
    }
}

async function getAnimeList(cli: typeof CLI) {
    Printer.print([null]);
    const stopLoader = Printer.printLoader('Find Anime');
    const animeList = await Kitsu.findLibraryAnime(cli.nonFlagArgs.join(' '));
    stopLoader();
    Printer.print([['h3', ['Find Anime']]]);
    if (!animeList.length) {
        Printer.printWarning(
            'The anime is either not in your cache or your search terms were ' +
                'incorrectly spelled',
            'No Entries Found',
            3
        );
        process.exit(0);
    }
    Printer.print([
        null,
        ['h2', ['Details Found'], 3],
        ['py', ['Query', cli.nonFlagArgs.join(' ')], 4],
        ['py', ['Status', `;m;${animeList.length} ;g;Anime Found`], 3],
        null,
        ['hl', 'c', 70, 3],
    ]);
    return animeList;
}

function displayAnimeList(animeList: SerializedAnime[]) {
    animeList.forEach((anime) => {
        const totalEps = anime.epCount ? anime.epCount : `;r;unknown`;
        const synonyms: Log[] = anime.synonyms.map((s) => ['py', [';b;Alt Title', s], 5]);
        Printer.print([
            ['py', ['Title JP', anime.title_jp], 6],
            ['py', ['Title EN', anime.title_en || ';r;undefined'], 6],
            ...synonyms,
            ['py', ['Progress', `;g;${anime.epProgress} ;by;/ ;m;${totalEps}`], 6],
            ['py', ['My Rating', `;g;${anime.rating ? anime.rating : ';y;Not Rated'}`], 5],
            ['py', ['Avg. Rating', `;g;${anime.avgRating}`], 3],
            ['py', ['Synopsis', `${anime.synopsis.trim()}`], 6],
            ['', `;b;Link: ;x;${anime.link}`, 13],
            ['hl', 'c', 70, 3],
        ]);
    });
}
