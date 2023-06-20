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
    }
}

async function getAnimeList(cli: typeof CLI) {
    Printer.print([null, null, ['h3', ['Find Anime']]]);
    const stopLoader = _con.printLoader('Fetching Anime');
    const animeList = await Kitsu.findLibraryAnime(cli.nonFlagArgs.join(' '));
    stopLoader();
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
        ['py', ['Query', cli.nonFlagArgs.join(' ')], 1],
        ['py', ['Status', `;m;${animeList.length} ;g;Anime Found`]],
        null,
        ['h3', ['Anime']],
        ['hl', 'c', 70],
    ]);
    return animeList;
}

function displayAnimeList(animeList: SerializedAnime[]) {
    animeList.forEach((anime) => {
        const totalEps = anime.epCount ? anime.epCount : `;r;unknown`;
        const synonyms: Log[] = anime.synonyms.map((s) => ['py', [';b;Alt Title', s], 2]);
        Printer.print([
            ['py', ['Title JP', anime.title_jp], 3],
            ['py', ['Title EN', anime.title_en || ';r;undefined'], 3],
            ...synonyms,
            ['py', ['Progress', `;g;${anime.epProgress} ;by;/ ;m;${totalEps}`], 3],
            ['py', ['My Rating', `;g;${anime.rating ? anime.rating : ';y;Not Rated'}`], 2],
            ['py', ['Avg. Rating', `;g;${anime.avgRating}`]],
            ['py', ['Synopsis', `${anime.synopsis.trim()}`], 3],
            ['', `;b;Link: ;x;${anime.link}`, 10],
            ['hl', 'c', 70],
        ]);
    });
}
