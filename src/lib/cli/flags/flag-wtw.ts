import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Log, Printer } from '../../printer/printer.js';
import { readdir } from 'fs/promises';
import { FansubFilenameData, parseFansubFilename, pathJoin } from '../../utils.js';
import { Config } from '../../config.js';
import { KitsuCacheItem } from '../../kitsu/kitsu-types.js';
import open from 'open';
import { autoWatchAnime } from '../../watch.js';
import { displayProgress } from './flag-watch.js';

type WhatToWatchData = {
    fileCount: number;
    fileName: string;
} & FansubFilenameData;

export class WhatToWatch extends CLIFlag {
    name: CLIFlagName = ['wtw', 'what-to-watch'];
    type: CLIFlagType = 'simple';

    helpAliases: string[] = [
        ...this.name,
        'what to watch',
        'recommend',
        'recommend what to watch',
        'recommendation',
        'give recommendation',
    ];

    shortHelpDisplay = `Displays all anime on disk that you haven't watched yet`;

    getHelpLogs(): Log[] {
        return [
            ['h1', ['What to Watch']],
            [
                'p',
                'This flag tries to find files that you have yet to watch, that are a ' +
                    'part of your watch list. It then displays the list of titles it found.',
            ],
            null,
            [
                'p',
                ';m;NOTE: ;bk;If you have not yet watched at least one episode of a ' +
                    'file it finds, then that title will not be listed.',
            ],
            null,
        ];
    }

    getSyntaxHelpLogs(): Log[] | null {
        return [
            ['h2', ['Syntax']],
            ['s', ['wtw', 'what-to-watch'], ''],
            null,
            ['h2', ['Examples']],
            ['e', ['wtw', '']],
            ['e', ['what-to-watch', '']],
        ];
    }

    async exec() {
        const filesAndFolders = await readdir(pathJoin(process.cwd()), { withFileTypes: true });
        let fileEntries = filesAndFolders.filter((ff) => ff.isFile()).sort();

        if (!fileEntries.length) {
            return Printer.printWarning(
                'No fansub files were found in the current directory.',
                'Operation Aborted'
            );
        }

        const fansubFileData = [];
        while (fileEntries.length) {
            const entry = fileEntries[0];
            const [error, parts] = parseFansubFilename(entry.name);

            if (error) {
                fileEntries.splice(0, 1);
                continue;
            }

            const { title } = parts;
            const fileCount = fileEntries.length;
            // Remove all entries with same title
            fileEntries = fileEntries.filter((entry) => !entry.name.includes(title));
            fansubFileData.push({
                ...parts,
                fileCount: fileCount - fileEntries.length,
                fileName: entry.name,
            });
        }

        const [whatToWatch, skippedFiles] = findWhatToWatch(fansubFileData);

        displayWhatToWatch(whatToWatch.map((wtw) => wtw[0]));
        if (skippedFiles.length) {
            Printer.print([null]);
            Printer.printWarning(skippedFiles, 'Not In Watch List');
        }

        const selection = await Printer.prompt(
            'Enter a number from the list above or hit enter to skip this.'
        );

        if (selection == '') return;

        const selectedNumber = Number(selection);

        if (!selectedNumber || selectedNumber > whatToWatch.length) {
            return Printer.printError(
                `Make sure you enter a number between 1 and ${whatToWatch.length}`,
                'Invalid Selection',
                3
            );
        }

        const selectedIndex = selectedNumber - 1;
        const [, wtwData] = whatToWatch[selectedIndex];

        await open(`${pathJoin(process.cwd(), wtwData.fileName)}`, { wait: true });

        const [anime, fileInfo, incrementAnime] = autoWatchAnime(wtwData.title, process.cwd());
        Printer.print([
            null,
            ['h3', ['Auto Incrementing Anime']],
            null,
            ['py', ['JP Title', anime.jpTitle]],
            ['py', ['EN Title', anime.enTitle]],
            ['py', ['File', `;y;${fileInfo.title} ;by;${fileInfo.paddedEpNum}`], 4],
            null,
            [
                'p',
                `;b;Progress will be set from ;bg;${anime.epProgress} ;b;to ;by;${
                    anime.epProgress + 1
                }`,
            ],
        ]);

        const hasConsent = await Printer.promptYesNo(
            'Do you want to proceed with the procedure above'
        );

        if (!hasConsent) {
            return Printer.printWarning(
                'User cancelled the operation manually.',
                'Operation Aborted',
                3
            );
        }

        const stopLoader = Printer.printLoader('Updating Progress', 2);
        const { completed, anime: newAnimeObj, tokenExpiresIn } = await incrementAnime();
        stopLoader();
        displayProgress({ anime: newAnimeObj, autoIncrement: true, completed, tokenExpiresIn });
    }
}

function findWhatToWatch(fileData: WhatToWatchData[]) {
    const badFiles: string[] = [];
    const whatToWatch: [KitsuCacheItem, WhatToWatchData][] = [];

    for (const data of fileData) {
        const fileBinding = Config.getKitsuProp('fileBindings').find(
            (fb) => fb.name.toLowerCase() == data.title.toLowerCase()
        );

        if (!fileBinding) {
            badFiles.push(`;r;[${data.fansub}] ${data.title} - ${data.paddedEpNum}`);
            continue;
        }

        const a = Config.getKitsuProp('cache').find(
            (cachedAnime) => cachedAnime.libID == fileBinding.id
        );

        if (!a) {
            throw Error(`${data.title} does not exist in anime cache`);
        }

        whatToWatch.push([a, data]);
    }

    return [whatToWatch, badFiles] as const;
}

function displayWhatToWatch(anime: KitsuCacheItem[]) {
    anime.forEach((a, i) => {
        Printer.print([
            null,
            ['h1', [`${i + 1}`]],
            ['py', ['Title JP', `;x;${a.jpTitle}`]],
            ['py', ['Title EN', `${a.enTitle}`]],
        ]);
    });
}
