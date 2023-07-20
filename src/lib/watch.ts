import { existsSync, mkdirSync, readdirSync, renameSync } from 'node:fs';
import { Kitsu } from './kitsu/kitsu.js';
import { parseFansubFilename, pathJoin, truncateStr } from './utils.js';
import { KitsuCacheItem, KitsuCache } from './kitsu/kitsu-types.js';
import { Config } from './config.js';
import { Log, Printer } from './printer/printer.js';
import { ColorCode, colorWord } from './printer/print-colors.js';

type ProgressOptions = {
    /** Anime being updated */
    anime: KitsuCacheItem;
    /** Cache Index of **anime** being updated */
    cacheIndex: number;
    /** Episode number to set as progress */
    epNum: number;
    /** Override episode number to set as progress */
    forcedEpNum: number;
    /** File name of the anime to update */
    fileName?: string;
};

export async function watchAnime(
    epName: string,
    epNumStrings: [string, string],
    workingDir: string,
    manual = false
) {
    const [fileEpNumStr, forcedEpNumStr] = epNumStrings;

    tryCreateWatchedDir(workingDir);

    const cachedAnime = Kitsu.animeCache.filter(
        (anime) =>
            anime.jpTitle.toLowerCase().includes(epName) ||
            anime.enTitle.toLowerCase().includes(epName) ||
            anime.synonyms.some((s) => s.toLowerCase().includes(epName))
    );

    const [validAnime, cacheIndex] = validateCachedAnime(cachedAnime, epName);

    const fileTitle = Kitsu.getFileBinding(validAnime.libID) ?? epName;

    let fileName = '';
    if (!manual) {
        const fansubFileNames = filterFansubFilenames(workingDir, fileTitle, fileEpNumStr);
        if (!fansubFileNames.length) {
            Printer.printError(
                [
                    `File: ;c;${fileTitle} ;y;episode ;c;${fileEpNumStr};y;`,
                    '',
                    '(Possible Issues)',
                    `(;bc;1;y;) ;c;Make sure you didn't ;m;misspell ;c;the file name.`,
                    `(;bc;2;y;) ;c;Make sure the ;m;episode number ;c;matches the file name.`,
                ],
                'File Not Found',
                3
            );
            process.exit(1);
        }
        if (fansubFileNames.length > 1) {
            displayErrorTooManyFiles(fansubFileNames);
            process.exit(1);
        }
        fileName = fansubFileNames[0];
    }

    await saveAnimeProgress({
        anime: validAnime,
        cacheIndex,
        epNum: Number(fileEpNumStr),
        forcedEpNum: Number(forcedEpNumStr),
        fileName,
    });

    if (!manual) {
        moveFileToWatchedDir(fileName, workingDir);
    }
}

function tryCreateWatchedDir(workingDir: string) {
    const watchedDir = pathJoin(workingDir, 'watched');

    if (!existsSync(watchedDir)) {
        mkdirSync(watchedDir);
        Printer.print([null, ['', `;c;Watch Dir: ;by;${watchedDir}`]]);
    }
}

function filterFansubFilenames(workingDir: string, epName: string, epNum: string) {
    return readdirSync(workingDir, { withFileTypes: true })
        .filter((file) => file.isFile())
        .map((file) => file.name)
        .filter(
            (name) =>
                name.match(/^\[([\w|\d|\s-]+)\]/gi) &&
                name.toLowerCase().includes(epName) &&
                name.includes(epNum.length == 1 ? `- 0${epNum}` : `- ${epNum}`)
        );
}

function displayErrorTooManyFiles(fileNames: string[]) {
    const errorChain = ['', `;r;More than one file name found`];

    for (const fileName of fileNames) {
        const [error, data] = parseFansubFilename(fileName);
        if (error) {
            Printer.printError(
                [`;bc;${error.parseError}`, '', `Failed to parse: ;x;${error.fileName}`],
                'Unsupported',
                3
            );
            process.exit(1);
        }
        const { title, paddedEpNum } = data;
        const saneFileName = truncateStr(title, 60);
        errorChain.push(`;by;${saneFileName} ;x;- ${paddedEpNum}`);
    }

    _con.chainError(errorChain);
}

function validateCachedAnime(cache: KitsuCache, animeName: string) {
    if (!cache.length) {
        Printer.printError(
            [
                `[;c;${animeName};y;] could not be found in the cache.`,
                '',
                ';bc;... ;y;Possible Issues ;bc;...',
                '(;bc;1;y;) ;c;You ;m;misspelled ;c;the file name or anime name.',
                '(;bc;2;y;) ;c;The Anime is ;m;not ;c;in your ;m;watch list;c;.',
                '(;bc;3;y;) ;c;You forgot to ;by;-rc ;c;after updating your ;m;watch list;c; manually.',
                '(;bc;4;y;) ;c;File name has not been ;m;bound ;c;to the cache yet.',
            ],
            'Anime Not Found'
        );
        process.exit(1);
    }

    if (cache.length > 1) {
        const files = cache.map(
            (c, i) => `(;bc;${i + 1};y;): ;bk;${colorWord(c.jpTitle, animeName, 'bw', 'bk')}`
        );
        Printer.printError(
            [
                ...files,
                '',
                ';bc;... ;y;Solutions ;bc;...',
                '(;bc;1;y;) ;c;Use a ;m;different word ;c;of the title to reference the episode.',
                '(;bc;2;y;) ;c;Use a ;m;whole segment ;c;of the title to reference the episode.',
                '(;bc;3;y;) ;c;Use part of the ;m;English title ;c;to reference the episode.',
                '(;bc;3;y;) ;c;Use one of the ;m;Alt Titles ;c;to reference the episode.',
            ],
            'Multiple Titles Found'
        );
        process.exit(1);
    }
    return [
        structuredClone(cache[0]),
        Config.getKitsuProp('cache').findIndex((c) => c == cache[0]),
    ] as const;
}

async function saveAnimeProgress(opt: ProgressOptions) {
    const { anime, cacheIndex, forcedEpNum, epNum, fileName } = opt;

    const [progress, episodeCount] = await Kitsu.updateAnime(
        ...buildLibPatchReqArgs(anime.libID, forcedEpNum || epNum)
    );
    anime.epProgress = progress;

    const titleLogs: Log[] = [
        null,
        ['py', ['JP Title', anime.jpTitle]],
        ['py', ['EN Title', anime.enTitle || ';m;None']],
    ];

    // Kitsu may or may not know how many episodes an anime
    // will be at the beginning of a season, so we need to
    // make sure we keep up with those changes.
    anime.epCount = episodeCount ?? 0;

    // If an anime is completed, remove it from cache
    if (progress > 0 && progress == episodeCount) {
        Kitsu.removeAnimeFromCache(anime, { saveConfig: false });
        Printer.print([...titleLogs, ['py', ['Progress', ';bg;Completed']], null]);
        return Config.save();
    }

    if (!Kitsu.getFileBinding(anime.libID) && fileName) {
        const [error, data] = parseFansubFilename(fileName);
        if (error) {
            Printer.printError(
                [`;bc;${error.parseError}`, '', `Failed to parse: ;x;${error.fileName}`],
                'Unsupported',
                3
            );
            process.exit(1);
        }
        Kitsu.setFileBinding(anime.libID, data.title.toLowerCase());
    }

    Config.getKitsuProp('cache')[cacheIndex] = anime;
    Printer.print([
        ...titleLogs,
        ['py', ['Progress', `;g;${anime.epProgress} ;by;/ ;m;${anime.epCount || 'unknown'}`]],
        null,
    ]);
    Config.save();
}

function buildLibPatchReqArgs(id: string, progress: number) {
    return [
        `https://kitsu.io/api/edge/library-entries/${id}`,
        {
            data: {
                id,
                type: 'library-entries',
                attributes: {
                    progress,
                },
            },
        },
    ] as const;
}

function moveFileToWatchedDir(fileName: string, workingDir: string) {
    renameSync(pathJoin(workingDir, fileName), pathJoin(workingDir, 'watched', fileName));
}
