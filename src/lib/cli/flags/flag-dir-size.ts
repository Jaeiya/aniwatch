import { readdir } from 'fs/promises';
import {
    FansubFilenameData,
    createReadableBytesFunc,
    parseFansubFilename,
    pathJoin,
} from '../../utils.js';
import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
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

const toReadableBytes = createReadableBytesFunc();

export class DirInfoFlag extends CLIFlag {
    name: CLIFlagName = ['dir', 'dir-info'];
    type: CLIFlagType = 'simple';

    helpAliases: string[] = [
        ...this.name,
        'dir info',
        'watch folder',
        'watch directory',
        'folder info',
        'directory info',
    ];

    shortHelpDisplay = 'Analyzes the "watched" folder and displays breakdown.';

    getHelpLogs(): Log[] {
        return [
            ['h1', ['Display Watched Folder Info']],
            [
                'p',
                'Breaks down various details about the "watch" folder that may or may ' +
                    'not be relevant.',
            ],
            null,
        ];
    }

    async exec() {
        const watchPath = pathJoin(process.cwd(), 'watched');
        const dirEntries = await readdir(watchPath, {
            withFileTypes: true,
        });
        displayFolderInfo(await serializeFileStats(dirEntries));
    }
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
    return [stats.size, stats.mtimeMs, dirEnt.name, parseFansubFilename(dirEnt.name)];
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
