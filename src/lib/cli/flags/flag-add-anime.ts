import { Config } from '../../config.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import { Log, Printer } from '../../printer/printer.js';
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
                    'watch list. When executed, you will be presented with 5 of the most ' +
                    'accurate anime results, based on your search terms.',
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
        Printer.print([null]);
        const stopLoader = Printer.printLoader('Generating Anime Selection');
        const animeResults = await Kitsu.findAnime(cli.nonFlagArgs.join(' '));
        stopLoader();
        Printer.print([['h3', ['Generating Anime Selection']]]);
        if (!animeResults.length) {
            Printer.printWarning(
                'Try using a different query strategy like an alternate title, if ' +
                    `you don't know the exact Japanese name. You could also try describing ` +
                    'the anime in a short phrase which might be in its description.',
                'Anime Not Found',
                3
            );
            process.exit(0);
        }
        displayAnimeSelection(animeResults);
        const userChoice = await promptAnimeSelection(animeResults.length);

        if (!userChoice) {
            Printer.printWarning('Operation cancelled manually', 'Aborted', 3);
            process.exit(0);
        }

        Printer.print([null, ['h3', ['Adding Anime']]]);

        if (userChoice > 0) {
            const anime = animeResults[userChoice - 1];
            const foundAnime = Config.getKitsuProp('cache').find(
                (a) => anime.enTitle == a.enTitle
            );
            if (foundAnime) {
                Printer.printWarning('Anime already added to watch list', 'Aborted', 3);
                process.exit(0);
            }
            const resp = await Kitsu.trackAnime(anime.id);
            const { synopsis: _, avgRating: __, ...cacheAnime } = anime;
            Config.getKitsuProp('cache').push({
                libID: resp.data.id,
                ...cacheAnime,
                epProgress: 0,
            });
            Config.save();
            Printer.printInfo(`Added ;b;${anime.jpTitle};g; to Watch List`, 'Success', 3);
        }
    }
}

function displayAnimeSelection(animeArray: AnimeResults) {
    Printer.print([null]);
    animeArray.forEach((anime, i) => {
        const synonyms: Log[] = anime.synonyms.map((s) => ['py', ['Alias', `;b;${s}`], 6]);
        Printer.print([
            ['h1', [`${i + 1}`], 3],
            ['py', ['Title JP', `;y;${anime.jpTitle}`], 3],
            ['py', ['Title EN', anime.enTitle || ';m;None'], 3],
            ['py', ['Title US', anime.usTitle || ';m;None'], 3],
            ...synonyms,
            ['', `;c;Link: ;x;https://kitsu.io/anime/${anime.slug}`, 10],
            null,
        ]);
    });
}

async function promptAnimeSelection(animeResultsLength: number) {
    let userNumber = 0;
    while (userNumber == 0) {
        const userChoice = await Printer.prompt('Type the ;x;Number ;bb;of an Anime to add:');
        if (userChoice == '') {
            return 0;
        }
        const possibleNumChoice = Number(userChoice);
        if (
            !possibleNumChoice ||
            possibleNumChoice > animeResultsLength ||
            possibleNumChoice < 0
        ) {
            Printer.print([null]);
            Printer.printError(
                'Pick a number between ;bw;1 ;y;and ;bw;5 ;y;or hit enter to skip',
                'Invalid Choice',
                3
            );
            continue;
        }
        userNumber = possibleNumChoice;
        break;
    }
    return userNumber;
}
