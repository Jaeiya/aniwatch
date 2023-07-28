import { existsSync, mkdirSync, readdirSync, renameSync } from 'node:fs';
import { Kitsu } from './kitsu/kitsu.js';
import { parseFansubFilename, pathJoin } from './utils.js';
import { KitsuCacheItem, KitsuCache } from './kitsu/kitsu-types.js';
import { Config } from './config.js';
import { Printer } from './printer/printer.js';
import { colorWord } from './printer/print-colors.js';

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
            throw Error('Expected one, but found many files with same name');
        }
        fileName = fansubFileNames[0];
    }

    const progress = await saveAnimeProgress({
        anime: validAnime,
        cacheIndex,
        epNum: Number(fileEpNumStr),
        forcedEpNum: Number(forcedEpNumStr),
        fileName,
    });

    if (!manual) {
        moveFileToWatchedDir(fileName, workingDir);
    }

    return progress;
}

export function autoWatchAnime(epName: string, workingDir: string) {
    tryCreateWatchedDir(workingDir);

    const cachedAnime = Kitsu.animeCache.filter(
        (anime) =>
            anime.jpTitle.toLowerCase().includes(epName) ||
            anime.enTitle.toLowerCase().includes(epName) ||
            anime.synonyms.some((s) => s.toLowerCase().includes(epName))
    );

    const [anime, cacheIndex] = validateCachedAnime(cachedAnime, epName);

    const fileTitle = Kitsu.getFileBinding(anime.libID) ?? epName;

    // We assume files are watched in ascending order (1, 2, 3)
    const [firstFileName] = filterFansubFilenames(workingDir, fileTitle).sort();

    if (!firstFileName) {
        Printer.printError(
            [
                `File: ;c;${fileTitle}`,
                '',
                '(Possible Issues)',
                `(;bc;1;y;) ;c;Make sure you didn't ;m;misspell ;c;the file name.`,
            ],
            'File Not Found',
            3
        );
    }

    const [error, fileData] = parseFansubFilename(firstFileName);
    if (error) {
        throw Error(error.parseError);
    }

    return [
        anime,
        fileData,
        async () => {
            const progress = await saveAnimeProgress({
                anime,
                cacheIndex,
                epNum: anime.epProgress + 1,
                forcedEpNum: 0,
                fileName: firstFileName,
            });
            moveFileToWatchedDir(firstFileName, workingDir);
            return progress;
        },
    ] as const;
}

function tryCreateWatchedDir(workingDir: string) {
    const watchedDir = pathJoin(workingDir, 'watched');

    if (!existsSync(watchedDir)) {
        mkdirSync(watchedDir);
        Printer.print([null, ['', `;c;Watch Dir: ;by;${watchedDir}`]]);
    }
}

function filterFansubFilenames(workingDir: string, epName: string, epNum?: string) {
    return readdirSync(workingDir, { withFileTypes: true })
        .filter((file) => file.isFile())
        .map((file) => file.name)
        .filter(
            (name) =>
                //! This is no longer effective
                (name.match(/^\[([\w|\d|\s-]+)\]/gi) && name.toLowerCase().includes(epName)) ||
                (epNum && name.includes(epNum.length == 1 ? `- 0${epNum}` : `- ${epNum}`))
        );
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

    // Kitsu may or may not know how many episodes an anime
    // will be at the beginning of a season, so we need to
    // make sure we keep up with those changes.
    anime.epCount = episodeCount ?? 0;

    // If an anime is completed, remove it from cache
    if (progress > 0 && progress == episodeCount) {
        Kitsu.removeAnimeFromCache(anime, { saveConfig: false });
        Config.save();
        return {
            completed: true,
            anime,
        } as const;
    }

    // TODO - This has nothing to do with anime progress so should be refactored out
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
    Config.save();
    return {
        completed: false,
        anime,
    } as const;
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
