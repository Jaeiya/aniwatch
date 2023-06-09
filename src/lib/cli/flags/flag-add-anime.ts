import { Config } from '../../config.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import { Log } from '../../printer/printer.js';
import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';

type AnimeResults = Awaited<ReturnType<typeof Kitsu.findAnime>>;

export class AddAnime extends CLIFlag {
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

    getHelpLogs(): Log[] {
        return [
            ['h1', ['Add Anime']],
            [
                'p',
                'This flag allows you to lookup an anime from Kitsu and add it to your ' +
                    'watch list.',
            ],
            null,
        ];
    }

    getSyntaxHelpLogs(): Log[] {
        return [
            ['h2', ['Syntax']],
            ['s', ['a', 'add-anime'], '<query>'],
            null,
            ['h2', ['Details']],
            [
                'd',
                [
                    'query',
                    'Any term that you want to use to search for an anime: ' +
                        ';m;title name;x;, ;m;keyword;x;, etc...',
                ],
            ],
            null,
            ['h2', ['Examples']],
            ['e', ['a', 'boku no hero']],
            ['e', ['add-anime', 'boku no hero']],
            ['e', ['a', 'heros have quirks']],
            ['e', ['add-anime', 'heros have quirks']],
        ];
    }

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
