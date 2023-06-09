import { readdir, stat, unlink } from 'node:fs/promises';
import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { pathJoin } from '../../utils.js';
import { Dirent } from 'node:fs';
import { Log } from '../../printer/printer.js';

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
        if (arg == 'old') {
            if (!(await hasConsent())) {
                return _con.chainInfo(['', ';bc;Operation: ;bg;Aborted!']);
            }
            await tryDeleteOldFiles();
        }

        if (arg == 'all') {
            if (!(await hasConsent())) {
                return _con.chainInfo(['', ';bc;Operation: ;bg;Aborted!']);
            }
            await deleteAllFiles();
        }
    };
}

async function hasConsent() {
    const resp = await _con.prompt(';by;Are you sure? ;bw;(y/n);x;: ;bc;');
    return resp == 'y';
}

async function tryDeleteOldFiles() {
    const filesPendingDeletion = await deleteOldFiles();
    if (!filesPendingDeletion.length) {
        _con.chainInfo(['', ';bc;Watch Directory: ;bg;Already Clean!']);
        return;
    }
    await Promise.all(filesPendingDeletion);
    _con.chainInfo([
        '',
        `;bc;Watch Directory: ;bg;${filesPendingDeletion.length} ;by;Files Cleaned!`,
    ]);
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
    const filesToDelete = fileList.filter((v) => !latestFilesPerSeries.includes(v.name));
    if (!filesToDelete.length) return [];
    return filesToDelete.map((v) => unlink(pathJoin(watchDir, v.name)));
}

async function deleteAllFiles() {
    const fileNames = await readdir(pathJoin(process.cwd(), 'watched'));
    if (!fileNames.length) {
        return _con.chainInfo(['', ';bc;Watch Directory: ;bg;Already Clean!']);
    }
    const pendingFiles = [];
    for (const name of fileNames) {
        pendingFiles.push(unlink(pathJoin(process.cwd(), 'watched', name)));
    }
    await Promise.all(pendingFiles);
    _con.chainInfo(['', `;bc;Watch Directory: ;bg;${pendingFiles.length} ;by;Files Deleted!`]);
}

function findLatestFilesPerSeries(stats: (readonly [string, number])[]) {
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
    return (v2: readonly [string, number]) => {
        const isSimilar = v1.split(' - ')[0] == v2[0].split(' - ')[0];
        return isEqual ? isSimilar : !isSimilar;
    };
}

function notSimilarFiles(v1: string) {
    return hasSimilarFiles(v1, false);
}

async function getFileStats(dirEnt: Dirent) {
    const stats = await stat(pathJoin(process.cwd(), 'watched', dirEnt.name));
    return [dirEnt.name, stats.ctimeMs] as const;
}
