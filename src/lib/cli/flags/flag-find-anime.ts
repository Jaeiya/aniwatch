import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import { SerializedAnime } from '../../kitsu/kitsu-types.js';
import { truncateStr } from '../../utils.js';
import { Log } from '../../printer/printer.js';

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
            ['s', [['f', 'find-anime'], '<name>']],
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
    _con.chainInfo(['', ';bm;... Find Anime ...']);
    const stopLoader = _con.printLoader('Fetching Anime');
    const animeList = await Kitsu.findLibraryAnime(cli.nonFlagArgs.join(' '));
    stopLoader();
    if (!animeList.length) {
        _con.chainInfo([
            `;by;No Entries Found`,
            'The anime is either not in your cache or your search',
            'terms were incorrectly spelled.',
        ]);
        process.exit(0);
    }
    return animeList;
}

function displayAnimeList(animeList: SerializedAnime[]) {
    animeList.forEach((anime) => {
        const totalEps = anime.epCount ? anime.epCount : `;r;unknown`;
        const synonyms = anime.synonyms.map((s) => `;bc;Alt Title: ;bb;${s}`);
        _con.chainInfo([
            `;bc;Title JP: ;x;${anime.title_jp}`,
            `;bc;Title EN: ;x;${anime.title_en || ';m;None'}`,
            ...synonyms,
            `;bc;Progress: ;g;${anime.epProgress} ;by;/ ;m;${totalEps}`,
            `;bc;My Rating: ;g;${anime.rating ? anime.rating : 'Not Rated'}`,
            `;bc;Avg. Rating: ;g;${anime.avgRating}`,
            `;bc;Link: ;x;${anime.link}`,
            `;bc;Synopsis: ;x;${truncateStr(anime.synopsis, 300)}`,
            '',
        ]);
    });
}
