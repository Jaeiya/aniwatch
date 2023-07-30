import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import { SerializedAnime } from '../../kitsu/kitsu-types.js';
import { Log, Printer } from '../../printer/printer.js';
import { Config } from '../../config.js';

type AnimeResults = Awaited<ReturnType<typeof Kitsu.findAnime>>;

export class FindAnimeFlag extends CLIFlag {
    name: CLIFlagName = ['a', 'anime'];
    type: CLIFlagType = 'multiArg';

    helpAliases: string[] = [
        ...this.name,
        'find anime',
        'get anime',
        'lookup anime',
        'search anime',
        'add anime',
        'track anime',
        'add to watch list',
        'add anime to watch list',
    ];

    getHelpLogs(): Log[] {
        return [
            ['h1', ['Anime']],
            [
                'p',
                'This flag allows you to perform different operations with your anime. The ' +
                    'first of which, is to get more details of existing anime in your cache ' +
                    '(find anime). The second, is to add new anime to your watch list. Read the ' +
                    'syntax below to get an idea of how it works.',
            ],
            null,
        ];
    }

    getSyntaxHelpLogs(): Log[] {
        return [
            ['h2', ['Syntax']],
            ['s', ['a', 'anime'], '<find|add> ;bm;<query>'],
            null,
            ['h2', ['Details']],
            [
                'd',
                [
                    'find',
                    'Looks up the ;bm;query ;x;in your cache; if an anime is found, then ' +
                        'that anime is retrieved from Kitsu to display more detailed info.',
                ],
            ],
            null,
            [
                'd',
                [
                    'add',
                    'Looks up the ;bm;query ;x;on Kitsu, retrieves the top ;bw;5 ;x;results ' +
                        'and allows you to select which anime to add.',
                ],
                1,
            ],
            null,
            ['h2', ['Examples']],
            ['e', ['a', 'find ;bm;boku no hero']],
            ['e', ['anime', 'find ;bm;re zero']],
            null,
            ['e', ['a', 'add ;bm;berserk']],
            ['e', ['anime', 'add ;bm;dragonball z']],
        ];
    }

    async exec() {
        const [arg, ...query] = CLI.nonFlagArgs;
        const hasValidArgs = CLI.validateSingleArg({
            args: ['find', 'add'],
            argHasArgs: true,
            flag: this,
        });

        if (hasValidArgs) {
            if (arg == 'find') {
                const queryStr = query.join(' ');
                const animeList = await findAnime(queryStr);
                Printer.print([
                    null,
                    ['h2', ['Details Found'], 3],
                    ['py', ['Query', queryStr], 4],
                    ['py', ['Status', `;m;${animeList.length} ;g;Anime Found`], 3],
                    null,
                    ['hl', 'c', 70, 3],
                    ...getAnimeListLogs(animeList),
                ]);
            }

            if (arg == 'add') {
                return addAnime();
            }
        }
    }
}

async function findAnime(query: string) {
    Printer.print([null]);
    const stopLoader = Printer.printLoader('Find Anime');
    const animeList = await Kitsu.findLibraryAnime(query);
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
    return animeList;
}

async function addAnime() {
    Printer.print([null]);
    const stopLoader = Printer.printLoader('Generating Anime Selection');
    const animeResults = await Kitsu.findAnime(CLI.nonFlagArgs.join(' '));
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
        const foundAnime = Config.getKitsuProp('cache').find((a) => anime.enTitle == a.enTitle);
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

function getAnimeListLogs(animeList: SerializedAnime[]) {
    const listLogs: Log[] = [];
    for (const anime of animeList) {
        const totalEps = anime.epCount ? anime.epCount : `;r;unknown`;
        const synonyms: Log[] = anime.synonyms.map((s) => ['py', [';b;Alt Title', s], 5]);
        const logs: Log[] = [
            ['py', ['Title JP', anime.title_jp], 6],
            ['py', ['Title EN', anime.title_en || ';r;undefined'], 6],
            ...synonyms,
            ['py', ['Progress', `;g;${anime.epProgress} ;by;/ ;m;${totalEps}`], 6],
            ['py', ['My Rating', `;g;${anime.rating ? anime.rating : ';y;Not Rated'}`], 5],
            ['py', ['Avg. Rating', `;g;${anime.avgRating}`], 3],
            ['py', ['Synopsis', `${anime.synopsis.trim()}`], 6],
            ['', `;b;Link: ;x;${anime.link}`, 13],
            ['hl', 'c', 70, 3],
        ];
        listLogs.push(...logs);
    }
    return listLogs;
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