import { readdir, unlink } from 'fs/promises';
import {
    FansubFilenameData,
    parseFansubFilename,
    pathJoin,
    toReadableBytes,
} from '../../utils.js';
import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { stat } from 'fs/promises';
import { Dirent } from 'fs';
import { fitStringEnd } from '../../utils.js';
import { Log, Printer } from '../../printer/printer.js';

type FileStat = [
    bytes: number,
    modifiedTimeMs: number,
    fileName: string,
    filenameData: FansubFilenameData
];

export class Directory extends CLIFlag {
    name: CLIFlagName = ['d', 'dir'];
    type: CLIFlagType = 'multiArg';

    helpAliases: string[] = [
        ...this.name,
        'dir info',
        'watch folder',
        'watch directory',
        'folder info',
        'directory info',
        'clean',
        'clean files',
        'delete files',
        'clean watched dir',
        'clean watch dir',
        'clean watched directory',
        'delete watched files',
        'delete watch files',
    ];

    shortHelpDisplay = 'Analyzes the "watched" folder and displays breakdown.';

    getHelpLogs(): Log[] {
        return [
            ['h1', ['Directory']],
            [
                'p',
                'This flag allows you to manipulate or view special information about, the ' +
                    ';x;watched ;bk;directory. The ;x;watched ;bk;directory contains all your ' +
                    'recently watched anime files and should be cleaned out regularly.',
            ],
            null,
        ];
    }

    getSyntaxHelpLogs(): Log[] {
        return [
            ['h2', ['Syntax']],
            ['s', ['d', 'dir'], '<info|clean> ;bm;<all|old>'],
            null,
            ['h2', ['Details']],
            [
                'd',
                [
                    'info ;bm;all',
                    'Displays verbose detailed information about the ;m;watch ;x;folder.',
                ],
                1,
            ],
            null,
            [
                'd',
                ['clean ;bm;all', 'Deletes ;bm;all ;x;files in the ;bw;watched ;x;directory.'],
            ],
            null,
            [
                'd',
                [
                    'clean ;bm;old',
                    'Deletes all ;bm;old ;x;files in the ;bw;watched ;x;directory, leaving ' +
                        'only the ;bw;latest files ;bk;of each anime.',
                ],
            ],
            null,
            ['h2', ['Examples']],
            ['e', ['d', 'info ;bm;all']],
            ['e', ['d', 'clean ;bm;old']],
            ['e', ['d', 'clean ;bm;all']],
            ['e', ['dir', 'info ;bm;all']],
            ['e', ['dir', 'clean ;bm;old']],
            ['e', ['dir', 'clean ;bm;all']],
        ];
    }

    async exec() {
        const hasValidFlags = CLI.validateSingleArg({
            args: ['info', 'clean'],
            argHasArgs: true,
            flag: this,
        });

        if (hasValidFlags) {
            const [arg, modArg] = CLI.nonFlagArgs;

            if (arg == 'clean') {
                if (modArg != 'all' && modArg != 'old') {
                    Printer.printError(
                        `The syntax for the ;bw;clean ;y;command is as follows:`,
                        'Invalid Clean Argument'
                    );
                    return this.printSyntax();
                }

                const hasConsented = await Printer.promptYesNo(
                    'This operation cannot be undone, are you sure'
                );
                if (!hasConsented) {
                    return Printer.printInfo('Cancelled by user input', 'Operation Aborted');
                }
            }

            if (arg == 'info' && modArg == 'all') {
                const watchPath = pathJoin(process.cwd(), 'watched');
                const dirEntries = await readdir(watchPath, {
                    withFileTypes: true,
                });
                if (dirEntries.length == 0) {
                    return Printer.printInfo(
                        'Your ;x;watch ;g;directory is empty; no meaningful info available.',
                        'Empty Directory',
                        3
                    );
                }
                displayFolderInfo(await serializeFileStats(dirEntries));
            }

            if (arg == 'clean' && modArg == 'old') {
                return cleanOldFiles();
            }

            if (arg == 'clean' && modArg == 'all') {
                return cleanAllFiles();
            }
        }
    }
}

async function cleanOldFiles() {
    const stopLoader = Printer.printLoader('Deleting Old Files');
    const [deletedFileCount, freedBytes] = await deleteOldFiles();
    stopLoader();

    if (deletedFileCount == 0) {
        return Printer.printWarning('No old files to clean out', 'Operation Aborted', 3);
    }

    Printer.printInfo(
        [
            `Removed ;bg;${deletedFileCount} ;g;Old Files`,
            `Freed ;bg;${toReadableBytes(freedBytes)} ;g;of space`,
        ],
        'Success',
        3
    );
}

async function cleanAllFiles() {
    const stopLoader = Printer.printLoader('Deleting ALL Files');
    const [deletedFileCount, freedBytes] = await deleteAllFiles();
    stopLoader();

    if (deletedFileCount == 0) {
        return Printer.printWarning('Watch directory is already empty', 'Operation Aborted', 3);
    }

    Printer.printInfo(
        [
            `Removed ;bg;${deletedFileCount} ;g;Files`,
            `Freed ;bg;${toReadableBytes(freedBytes)} ;g;of space`,
        ],
        'Operation Successful',
        3
    );
}

function displayFolderInfo(fileStats: Awaited<ReturnType<typeof serializeFileStats>>) {
    const {
        size,
        fileCount,
        avgFileSize,
        lastWatchedFile,
        lastWatchedFileDate,
        lastWatchedFileSize,
        oldestFile,
        oldestFileDate,
        oldestFileSize,
        largestFile,
        largestFileSize,
        smallestFile,
        smallestFileSize,
    } = fileStats;

    const indent = 9;

    Printer.print([
        null,
        ['h2', ['Directory Details']],
        [
            'p',
            `;c;${fitStringEnd('Location', 15)} ;x;: ;g;${pathJoin(process.cwd(), 'watched')}`,
        ],
        ['p', `;c;${fitStringEnd('Size', 15)} ;x;: ;y;${size}`],
        ['p', `;c;${fitStringEnd('File Count', 15)} ;x;: ;y;${fileCount}`],
        ['p', `;c;${fitStringEnd('Avg. File Size', 15)} ;x;: ;y;${avgFileSize}`],
        null,
        ['h2', ['File Details']],
        ['p', `;c;${fitStringEnd('Newest', 8)} ;bk;: ;x;${lastWatchedFile}`],
        ['p', `: ;y;${lastWatchedFileDate.toLocaleString()}`, indent],
        ['p', `: ;y;${lastWatchedFileSize}`, indent],
        null,
        ['p', `;c;${fitStringEnd('Oldest', 8)} ;bk;: ;x;${oldestFile}`],
        ['p', `: ;y;${oldestFileDate.toLocaleString()}`, indent],
        ['p', `: ;y;${oldestFileSize}`, indent],
        null,
        ['p', `;c;${fitStringEnd('Largest', 8)} ;bk;: ;x;${largestFile}`],
        ['p', `: ;y;${largestFileSize}`, indent],
        null,
        ['p', `;c;${fitStringEnd('Smallest', 8)} ;bk;: ;x;${smallestFile}`],
        ['p', `: ;y;${smallestFileSize}`, indent],
        null,
    ]);
}

async function serializeFileStats(dirEntries: Dirent[]) {
    const fileStats = await Promise.all(loadFileStats(dirEntries));
    const fileCount = fileStats.filter((f) => f[0] > 0).length;
    const totalFileBytes = fileStats.reduce(toSumOfBytes, 0);
    const lastWatchedFileStat = fileStats.reduce(toLatestFileStat);
    const largestFileStat = fileStats.reduce(toLargestFileStat);
    const smallestFileStat = fileStats.reduce(toSmallestFileStat);
    const oldestFileStat = fileStats.reduce(toOldestFileStat);
    const avgFileSize = toReadableBytes(totalFileBytes / fileCount);
    return {
        size: toReadableBytes(totalFileBytes),
        lastWatchedFile: lastWatchedFileStat[3].title,
        lastWatchedFileSize: toReadableBytes(lastWatchedFileStat[0]),
        lastWatchedFileDate: new Date(lastWatchedFileStat[1]),
        oldestFile: oldestFileStat[3].title,
        oldestFileSize: toReadableBytes(oldestFileStat[0]),
        oldestFileDate: new Date(oldestFileStat[1]),
        fileCount,
        avgFileSize,
        largestFileSize: toReadableBytes(largestFileStat[0]),
        largestFile: largestFileStat[3].title,
        smallestFileSize: toReadableBytes(smallestFileStat[0]),
        smallestFile: smallestFileStat[3].title,
    };
}

function loadFileStats(dirEntries: Dirent[]) {
    const filePromises: Promise<FileStat>[] = [];
    for (const dent of dirEntries) {
        if (dent.isFile()) {
            filePromises.push(getFileStats(dent));
        }
    }
    return filePromises;
}

async function getFileStats(dirEnt: Dirent): Promise<FileStat> {
    const stats = await stat(pathJoin(process.cwd(), 'watched', dirEnt.name));
    const [error, data] = parseFansubFilename(dirEnt.name);
    if (error) {
        throw Error(error.parseError);
    }
    return [stats.size, stats.mtimeMs, dirEnt.name, data];
}

function toLatestFileStat(lastStat: FileStat, currentStat: FileStat) {
    return currentStat[1] > lastStat[1] ? currentStat : lastStat;
}

function toLargestFileStat(lastStat: FileStat, currentStat: FileStat) {
    return currentStat[0] > lastStat[0] ? currentStat : lastStat;
}

function toSmallestFileStat(lastStat: FileStat, currentStat: FileStat) {
    return currentStat[0] < lastStat[0] ? currentStat : lastStat;
}

function toOldestFileStat(lastStat: FileStat, currentStat: FileStat) {
    return currentStat[1] < lastStat[1] ? currentStat : lastStat;
}

function toSumOfBytes(bytes: number, stat: FileStat) {
    return bytes + stat[0];
}

async function deleteOldFiles() {
    const watchDir = pathJoin(process.cwd(), 'watched');
    const statPromises = [];
    const fileList = await readdir(watchDir, { withFileTypes: true });
    for (const file of fileList) {
        statPromises.push(getOldFileStats(file));
    }
    const stats = await Promise.all(statPromises);
    const latestFansubFiles = getLatestFansubFiles(stats);
    const filesToDelete = stats.filter((s) => !latestFansubFiles.includes(s[0]));
    if (!filesToDelete.length) return [0, 0] as const;
    const deletedFileCount = (
        await Promise.all(filesToDelete.map((file) => unlink(pathJoin(watchDir, file[0]))))
    ).length;
    return [deletedFileCount, filesToDelete.reduce((pv, cv) => (pv += cv[2]), 0)] as const;
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
        statPromises.push(getOldFileStats(file));
    }
    const stats = await Promise.all(statPromises);

    const pendingDeletion = [];
    for (const [fileName] of stats) {
        pendingDeletion.push(unlink(pathJoin(process.cwd(), 'watched', fileName)));
    }
    await Promise.all(pendingDeletion);
    return [pendingDeletion.length, stats.reduce((pv, cv) => (pv += cv[2]), 0)] as const;
}

function getLatestFansubFiles(stats: (readonly [string, number, number])[]) {
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
        const [file1Error, file1Data] = parseFansubFilename(v1);
        const [file2Error, file2Data] = parseFansubFilename(v2[0]);

        if (file1Error || file2Error) {
            throw Error('Failed to parse files properly');
        }

        const isSimilar =
            `${file1Data.fansub} ${file1Data.title}` ==
            `${file2Data.fansub} ${file2Data.title}`;

        return isEqual ? isSimilar : !isSimilar;
    };
}

function notSimilarFiles(v1: string) {
    return hasSimilarFiles(v1, false);
}

async function getOldFileStats(dirEnt: Dirent) {
    const stats = await stat(pathJoin(process.cwd(), 'watched', dirEnt.name));
    return [dirEnt.name, stats.ctimeMs, stats.size] as const;
}
