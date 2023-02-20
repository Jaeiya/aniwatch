import { readdir } from 'fs/promises';
import { Help } from '../../help.js';
import { createReadableBytesFunc, pathJoin, stripFansubInfo } from '../../utils.js';
import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { stat } from 'fs/promises';
import { Logger } from '../../logger.js';
import { Dirent } from 'fs';
import { fitStringEnd } from '../../utils.js';

type FileStat = [bytes: number, modifiedTimeMs: number, fileName: string];

const { h1, h2, ex, f, x, arg, d } = Help.colors;
const { nl } = Help.textFlowUtils;
const toReadableBytes = createReadableBytesFunc();

export class DirInfoFlag implements CLIFlag {
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

    helpDisplay: string[] = [
        `${h1}Display Watched Folder Info:`,
        `${nl}Breaks down various details about the "watch" folder`,
        `${nl}that may or may not be relevant.`,
        '',
    ];

    async exec() {
        const watchPath = pathJoin(process.cwd(), 'watched');
        const dirEntries = await readdir(watchPath, {
            withFileTypes: true,
        });
        displayFolderInfo(await serializeFileStats(dirEntries));
    }
}

function displayFolderInfo(fileStats: Awaited<ReturnType<typeof serializeFileStats>>) {
    const indent = ' '.repeat(8);
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

    Logger.chainInfo([
        `${ex}Watched Folder Info`,
        `${nl}The following is a detailed analysis of the "watched"`,
        `${nl}folder on your disk.`,
        '',
        `${h2}Folder Details`,
        `${nl}${f}${fitStringEnd('Size', 15)} ${d}: ${arg}${size}`,
        `${nl}${f}${fitStringEnd('File Count', 15)} ${d}: ${arg}${fileCount}`,
        `${nl}${f}${fitStringEnd('Avg. File Size', 15)} ${d}: ${arg}${avgFileSize}`,
        '',
        `${h2}File Details`,
        `${nl}${f}${fitStringEnd('Newest', 8)} ${d}: ${x}${lastWatchedFile}`,
        `${nl}${indent} ${d}: ${arg}${lastWatchedFileDate.toLocaleString()}`,
        `${nl}${indent} ${d}: ${arg}${lastWatchedFileSize}`,
        ' ',
        `${nl}${f}${fitStringEnd('Oldest', 8)} ${d}: ${x}${oldestFile}`,
        `${nl}${indent} ${d}: ${arg}${oldestFileDate.toLocaleString()}`,
        `${nl}${indent} ${d}: ${arg}${oldestFileSize}`,
        ' ',
        `${nl}${f}${fitStringEnd('Largest', 8)} ${d}: ${x}${largestFile}`,
        `${nl}${indent} ${d}: ${arg}${largestFileSize}`,
        ' ',
        `${nl}${f}${fitStringEnd('Smallest', 8)} ${d}: ${x}${smallestFile}`,
        `${nl}${indent} ${d}: ${arg}${smallestFileSize}`,
    ]);
}

async function serializeFileStats(dirEntries: Dirent[]) {
    const fileStats = await Promise.all(loadFileStats(dirEntries));
    const fileCount = fileStats.filter((f) => f[0] > 0).length;
    const bytes = fileStats.reduce(toSumOfBytes, 0);
    const lastWatchedFileStat = fileStats.reduce(toLatestFileStat);
    const largestFileStat = fileStats.reduce(toLargestFileStat);
    const smallestFileStat = fileStats.reduce(toSmallestFileStat);
    const oldestFileStat = fileStats.reduce(toOldestFileStat);
    const avgFileSize = toReadableBytes(bytes / fileCount);
    return {
        size: toReadableBytes(bytes),
        lastWatchedFile: stripFansubInfo(lastWatchedFileStat[2]),
        lastWatchedFileSize: toReadableBytes(lastWatchedFileStat[0]),
        lastWatchedFileDate: new Date(lastWatchedFileStat[1]),
        oldestFile: stripFansubInfo(oldestFileStat[2]),
        oldestFileSize: toReadableBytes(oldestFileStat[0]),
        oldestFileDate: new Date(oldestFileStat[1]),
        fileCount,
        avgFileSize,
        largestFileSize: toReadableBytes(largestFileStat[0]),
        largestFile: stripFansubInfo(largestFileStat[2]),
        smallestFileSize: toReadableBytes(smallestFileStat[0]),
        smallestFile: stripFansubInfo(smallestFileStat[2]),
    };
}

function loadFileStats(dirEntries: Dirent[]) {
    const filePromises: Promise<FileStat>[] = [];
    for (const dent of dirEntries) {
        filePromises.push(getFileStats(dent));
    }
    return filePromises;
}

async function getFileStats(dirEnt: Dirent): Promise<FileStat> {
    if (dirEnt.isFile()) {
        const stats = await stat(pathJoin(process.cwd(), 'watched', dirEnt.name));
        return [stats.size, stats.mtimeMs, dirEnt.name];
    }
    return [0, 0, dirEnt.name];
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
