import { Config } from '../../config.js';
import { Help } from '../../help.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import type { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';

const { h1, h2, nl, i3 } = Help.display;
type AnimeResults = Awaited<ReturnType<typeof Kitsu.findAnime>>;

export class AddAnime implements CLIFlag {
    name: CLIFlagName = ['a', 'add'];
    type: CLIFlagType = 'multiArg';

    helpAliases: string[] = [
        ...this.name,
        'add anime',
        'track anime',
        'add to watch list',
        'add anime to watch list',
    ];

    shortHelpDisplay = `Allows you to add an anime to your watch list.`;

    helpSyntax: string[] = [
        h2(`Syntax`),
        nl(`;by;wak ;x;[;bc;-a ;x;| ;bc;--add-anime;x;] ;y;<query>`),
        '',
        h2(`Details`),
        nl(`;y;query  ;x;Any terms that you want to use to search`),
        i3(` ;x;for an anime: ;m;title name;x;, ;m;keyword;x;, etc...`),
        '',
        h2(`Examples`),
        nl(`;by;wak ;bc;-a ;y;boku no hero`),
        nl(`;by;wak ;bc;--add-anime ;y;boku no hero`),
        nl(`;by;wak ;bc;-a ;y;heros have quirks`),
        nl(`;by;wak ;bc;--add-anime ;y;heros have quirks`),
    ];

    helpDisplay: string[] = [
        h1(`Add Anime`),
        nl(`This flag allows you to lookup an anime from`),
        nl(`Kitsu and add it to your watch list.`),
        '',
        ...this.helpSyntax,
    ];

    async exec(cli: typeof CLI) {
        const loader = _con.getLoadPrinter();
        _con.chainInfo(['', ';bm;... Generating Anime Selection ...']);
        loader.start('Looking up Anime');
        const animeResults = await Kitsu.findAnime(cli.nonFlagArgs.join(' '));
        loader.stop();
        if (!animeResults.length) {
            _con.chainInfo([';bc;Status: ;y;No Anime Found']);
            process.exit(0);
        }
        displayAnimeSelection(animeResults);
        const userChoice = await promptAnimeSelection(animeResults.length);

        _con.chainInfo(['', ';bm;... Adding Anime ...']);
        if (!userChoice) {
            _con.chainInfo([';bc;Status: ;y;Aborted by User']);
            process.exit(0);
        }

        if (userChoice > 0) {
            const anime = animeResults[userChoice - 1];
            const foundAnime = Config.getKitsuProp('cache').find(
                (a) => anime.enTitle == a.enTitle
            );
            if (foundAnime) {
                _con.chainInfo([';bc;Status: ;r;Aborted => ;y;Anime Already Exists']);
                process.exit(0);
            }
            const resp = await Kitsu.trackAnime(anime.id);
            const { synopsis: _, avgRating: __, ...cacheAnime } = anime;
            Config.getKitsuProp('cache').push({
                libID: resp.data.id,
                ...cacheAnime,
                epProgress: 0,
            });
            _con.chainInfo([
                `;bc;Title: ;x;${anime.enTitle}`,
                `;bc;Status: ;bg;Success => ;g;Added to Watch List`,
            ]);
            Config.save();
        }
    }
}

function displayAnimeSelection(animeArray: AnimeResults) {
    animeArray.forEach((anime, i) => {
        const synonyms = anime.synonyms.map((s) => `;bc;Alt Title: ;bb;${s}`);
        _con.chainInfo([
            `;bw;${i + 1}.`,
            `;bc;Title JP: ;x;${anime.jpTitle}`,
            `;bc;Title EN: ;x;${anime.enTitle || ';m;None'}`,
            ...synonyms,
            `;bc;Link: ;x;${anime.slug}`,
            '',
        ]);
    });
}

async function promptAnimeSelection(animeResultsLength: number) {
    let userNumber = 0;
    while (userNumber == 0) {
        const userChoice = await _con.prompt('Type the ;bw;Number ;x;of an Anime to add: ;bc;');
        if (userChoice == '') {
            return 0;
        }
        const possibleNumChoice = Number(userChoice);
        if (
            !possibleNumChoice ||
            possibleNumChoice > animeResultsLength ||
            possibleNumChoice < 0
        ) {
            _con.chainError([
                'Invalid choice, pick a number between ;bw;1 ;x;and ;bw;5 ;x;or hit enter to skip',
            ]);
            continue;
        }
        userNumber = possibleNumChoice;
        break;
    }
    return userNumber;
}
