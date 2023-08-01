import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Log, Printer } from '../../printer/printer.js';
import { readdir } from 'fs/promises';
import { FansubFilenameData, parseFansubFilename, pathJoin } from '../../utils.js';
import { Config } from '../../config.js';

type WhatToWatchData = {
    fileCount: number;
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
            fansubFileData.push({ ...parts, fileCount: fileCount - fileEntries.length });
        }

        displayWhatToWatch(fansubFileData);
    }
}

function displayWhatToWatch(fileData: WhatToWatchData[]) {
    const badFiles = [];
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

        const totalEps = a.epCount ? a.epCount : `;bm;unknown`;
        Printer.print([
            null,
            ['py', ['Title JP', `;x;${a.jpTitle}`], 2],
            ['py', ['Title EN', `${a.enTitle}`], 2],
            ['py', ['Progress', `;g;${a.epProgress} ;by;/ ;m;${totalEps}`], 2],
            ['py', [';bc;File Count', `;x;${data.fileCount}`]],
            ['', `;c;File: ;y;[${data.fansub}] ${data.title} - ${data.paddedEpNum}`, 9],
        ]);
    }

    if (badFiles.length) {
        Printer.print([null]);
        Printer.printWarning(badFiles, 'Not In Watch List');
    }
}
