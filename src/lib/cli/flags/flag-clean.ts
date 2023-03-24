import { readdir, stat, unlink } from 'node:fs/promises';
import { Help } from '../../help.js';
import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { pathJoin } from '../../utils.js';
import { Dirent } from 'node:fs';

const { h1, h2, nl, i2 } = Help.display;

export class CleanFlag implements CLIFlag {
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

    helpSyntax: string[] = [
        h2(`Syntax`),
        nl(`;by;wak ;x;[;bc;-cln ;x;| ;bc;--clean;x;] ;y;<all|old>`),
        '',
        h2(`Details`),
        nl(`;y;all  ;x;Deletes all files within the ;m;watched ;x;directory.`),
        '',
        nl(';y;old  ;x;Keeps ;m;only ;x;the latest watched file from each'),
        i2('  ;x;anime series; deleting the rest.'),
        '',
        h2(`Examples`),
        nl(`;by;wak ;bc;-cln ;y;all`),
        nl(`;by;wak ;bc;--clean ;y;all`),
        nl(`;by;wak ;bc;-cln ;y;old`),
        nl(`;by;wak ;bc;--clean ;y;old`),
    ];

    helpDisplay: string[] = [
        h1(`Clean`),
        nl(`This flag allows you to clean your watched directory`),
        nl(`using two different methods: removing ;x;all ;bk;files or`),
        nl(`keeping the ;x;latest ;bk;files only.`),
        '',
        ...this.helpSyntax,
    ];
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
