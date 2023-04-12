import { Help } from '../../help.js';
import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import { SerializedAnime } from '../../kitsu/kitsu-types.js';
import { truncateStr } from '../../utils.js';

const { h1, h2, nl, i2 } = Help.display;

export class FindAnimeFlag implements CLIFlag {
    name: CLIFlagName = ['f', 'find-anime'];
    type: CLIFlagType = 'multiArg';

    helpAliases: string[] = [
        ...this.name,
        'find anime',
        'get anime',
        'lookup anime',
        'search anime',
    ];

    helpSyntax: string[] = [
        h2(`Syntax`),
        nl(`;by;wak ;x;[;bc;-f ;x;| ;bc;--find-anime;x;] ;y;<name>`),
        '',
        h2(`Details`),
        nl(`;y;name   ;x;The name of any anime in your "currently watching"`),
        i2(`    list on Kitsu.`),
        '',
        h2(`Examples`),
        nl(`;by;wak ;bc;-f ;y;"boku no hero"`),
        nl(`;by;wak ;bc;--find-anime ;y;berserk`),
    ];

    helpDisplay: string[] = [
        h1(`Find Anime`),
        nl(`This flag allows you to lookup an anime that already`),
        nl(`exists in your "currently watching" list, which is`),
        nl(`cached on your disk.`),
        '',
        nl(`;m;NOTE: ;bk;If the anime is not found, either it was typed`),
        nl(`incorrectly or it needs to be added to your watch`),
        nl(`list. If you add it to your watch list, you'll need`),
        nl(`to rebuild the cache with ;bc;-rc ;bk;or ;bc;--rebuild-cache;bk;.`),
        '',
        ...this.helpSyntax,
    ];

    async exec(cli: typeof CLI) {
        displayAnimeList(await getAnimeList(cli));
    }
}

async function getAnimeList(cli: typeof CLI) {
    _con.chainInfo(['', ';bm;... Find Anime ...']);
    const stopLoader = _con.printLoader('Fetching Anime');
    const animeList = await Kitsu.findAnime(cli.nonFlagArgs.join(' '));
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
        const totalEps = anime.totalEpisodes ? anime.totalEpisodes : `;r;unknown`;
        const synonyms = anime.synonyms.map((s) => `;bc;Alt Title: ;bb;${s}`);
        _con.chainInfo([
            `;bc;Title JP: ;x;${anime.title_jp}`,
            `;bc;Title EN: ;x;${anime.title_en || ';m;None'}`,
            ...synonyms,
            `;bc;Progress: ;g;${anime.progress} ;by;/ ;m;${totalEps}`,
            `;bc;My Rating: ;g;${anime.rating ? anime.rating : 'Not Rated'}`,
            `;bc;Avg. Rating: ;g;${anime.avgRating}`,
            `;bc;Link: ;x;${anime.link}`,
            `;bc;Synopsis: ;x;${truncateStr(anime.synopsis, 300)}`,
        ]);
    });
}
