import { readdir, stat, unlink } from 'node:fs/promises';
import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { pathJoin, toReadableBytes } from '../../utils.js';
import { Dirent } from 'node:fs';
import { Log, Printer } from '../../printer/printer.js';

export class CleanFlag extends CLIFlag {
    name: CLIFlagName = ['cln', 'clean'];
    type: CLIFlagType = 'multiArg';

    helpAliases: string[] = [
        ...this.name,
        'delete',
        'clean',
        'clean files',
        'delete shows',
        'clean shows',
        'clean watched dir',
        'clean watch dir',
        'clean watched directory',
        'delete watched files',
        'delete watch files',
        'delete files',
    ];

    shortHelpDisplay = 'Provides two methods to clean your "watched" directory.';

    getHelpLogs(): Log[] {
        return [
            ['h1', ['Clean']],
            [
                'p',
                'This flag allows you to clean your watched directory using two different ' +
                    'methods: removing ;x;all ;bk;files or keeping the ;x;latest ' +
                    ';bk;files only.',
            ],
            null,
        ];
    }

    getSyntaxHelpLogs(): Log[] {
        return [
            ['h2', ['Syntax']],
            ['s', ['cln', 'clean'], '<all|old>'],
            null,
            ['h2', ['Details']],
            ['d', ['all', 'Deletes all files within the ;m;watched ;x;directory.']],
            null,
            [
                'd',
                [
                    'old',
                    'Keeps ;m;only ;x;the latest watched file from each anime ' +
                        'series; deleting the rest.',
                ],
            ],
            null,
            ['h2', ['Examples']],
            ['e', ['cln', 'all']],
            ['e', ['clean', 'all']],
            ['e', ['cln', 'old']],
            ['e', ['clean', 'old']],
        ];
    }

    exec: (cli: typeof CLI) => void | Promise<void> = async (cli) => {
        const [arg] = cli.nonFlagArgs;

        const hasConsent = await Printer.promptYesNo('Are you sure');

        if (!hasConsent) {
            return Printer.printInfo('Cancelled by user input', 'Operation Aborted');
        }

        Printer.print([null]);

        if (arg == 'old') {
            const stopLoader = Printer.printLoader('Deleting Old Files');
            const [deletedFileCount, freedBytes] = await deleteOldFiles();
            stopLoader();

            Printer.print([['h3', ['Deleting Old Files']]]);

            if (deletedFileCount == 0) {
                return Printer.printWarning(
                    'No old files to clean out',
                    'Operation Aborted',
                    3
                );
            }

            Printer.printInfo(
                [
                    `Removed ;bg;${deletedFileCount} ;g;Old Files`,
                    `Freed ;bg;${freedBytes} ;g;of space`,
                ],
                'Success',
                3
            );
        }

        if (arg == 'all') {
            const stopLoader = Printer.printLoader('Deleting ALL Files');
            const [deletedFileCount, freedBytes] = await deleteAllFiles();
            stopLoader();

            Printer.print([['h3', ['Deleting ALL Files']]]);

            if (deletedFileCount == 0) {
                return Printer.printWarning(
                    'Watch directory is already empty',
                    'Operation Aborted',
                    3
                );
            }

            Printer.printInfo(
                [
                    `Removed ;bg;${deletedFileCount} ;g;Files`,
                    `Freed ;bg;${toReadableBytes(freedBytes)} ;g;of space`,
                ],
                'Operation Successful'
            );
        }
    };
}

async function deleteOldFiles() {
    const watchDir = pathJoin(process.cwd(), 'watched');
    const statPromises = [];
    const fileList = await readdir(watchDir, { withFileTypes: true });
    for (const file of fileList) {
        statPromises.push(getFileStats(file));
    }
    const stats = await Promise.all(statPromises);
    const latestFilesPerSeries = findLatestFilesPerSeries(stats);
    const filesToDelete = stats.filter((s) => !latestFilesPerSeries.includes(s[0]));
    if (!filesToDelete.length) return [0, ''] as const;
    const deletedFileCount = (
        await Promise.all(filesToDelete.map((file) => unlink(pathJoin(watchDir, file[0]))))
    ).length;
    return [
        deletedFileCount,
        toReadableBytes(filesToDelete.reduce((pv, cv) => (pv += cv[2]), 0)),
    ] as const;
}

async function deleteAllFiles() {
    const fileList = await readdir(pathJoin(process.cwd(), 'watched'), {
        withFileTypes: true,
    });

    if (!fileList.length) {
        return [0, 0] as const;
    }

    const statPromises = [];
    for (const file of fileList) {
        statPromises.push(getFileStats(file));
    }
    const stats = await Promise.all(statPromises);

    const pendingDeletion = [];
    for (const [fileName] of stats) {
        pendingDeletion.push(unlink(pathJoin(process.cwd(), 'watched', fileName)));
    }
    await Promise.all(pendingDeletion);
    return [pendingDeletion.length, stats.reduce((pv, cv) => (pv += cv[2]), 0)] as const;
}

function findLatestFilesPerSeries(stats: (readonly [string, number, number])[]) {
    const latestFiles = [];
    while (stats.length) {
        const similarFiles = stats
            .filter(hasSimilarFiles(stats[0][0]))
            .sort((a, b) => (a[1] > b[1] ? -1 : 1));
        latestFiles.push(similarFiles[0][0]);
        stats = stats.filter(notSimilarFiles(similarFiles[0][0]));
    }
    return latestFiles;
}

function hasSimilarFiles(v1: string, isEqual = true) {
    return (v2: readonly [string, number, number]) => {
        const isSimilar = v1.split(' - ')[0] == v2[0].split(' - ')[0];
        return isEqual ? isSimilar : !isSimilar;
    };
}

function notSimilarFiles(v1: string) {
    return hasSimilarFiles(v1, false);
}

async function getFileStats(dirEnt: Dirent) {
    const stats = await stat(pathJoin(process.cwd(), 'watched', dirEnt.name));
    return [dirEnt.name, stats.ctimeMs, stats.size] as const;
}
