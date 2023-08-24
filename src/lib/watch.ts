import { existsSync, mkdirSync, readdirSync, renameSync } from 'fs';
import { KitsuCache, KitsuCacheItem } from './kitsu/kitsu-types.js';
import { parseFansubFilename, pathJoin } from './utils.js';
import { Printer } from './printer/printer.js';
import { Kitsu } from './kitsu/kitsu.js';
import { Config } from './config.js';
import { colorWord } from './printer/print-colors.js';

type PartialTitle = string;

type WatchAnimeProps = {
    titleOrCache:
        | PartialTitle
        | [CachedAnime: KitsuCacheItem, CacheIndex: number, FileBinding: string];
    episode: [episode: number, forcedEpisode: number];
    workingDir?: string;
};

type ProgressOptions = {
    /** Anime being updated */
    anime: KitsuCacheItem;
    /** Index of cached anime being updated */
    cacheIndex: number;
    /** Episode number to set as progress */
    epNum: number;
    /** Override episode number to set as progress */
    forcedEpNum: number;
};

export type WatchReturns = Awaited<
    | ReturnType<typeof useAnimeWatcher>
    | ReturnType<typeof manageFile>
    | ReturnType<typeof useAnimeAutoWatcher>
>;

export type WatchError = WatchReturns[0];

export type IsWatchError<T> = T extends { msg: string } ? T : never;

export async function useAnimeWatcher({ titleOrCache, episode, workingDir }: WatchAnimeProps) {
    const rootDir = workingDir ?? process.cwd();
    const [epNum, forcedEpNum] = episode;
    let anime: KitsuCacheItem;
    let fileNameQuery: string;
    let fileBinding: string | undefined;
    let cacheIndex: number;

    tryCreateWatchedDir(rootDir);

    if (typeof titleOrCache == 'string') {
        const cachedAnime = Kitsu.findCachedAnime(titleOrCache);
        if (!cachedAnime.length) {
            return [{ msg: 'CACHE_NOT_FOUND', data: null }, null] as const;
        }

        if (cachedAnime.length > 1) {
            return [{ msg: 'MULTIPLE_CACHES', data: cachedAnime }, null] as const;
        }
        anime = cachedAnime[0][0];
        cacheIndex = cachedAnime[0][1];
        fileBinding = Kitsu.getFileBinding(anime.libID);
        fileNameQuery = fileBinding ?? titleOrCache;
    } else {
        anime = titleOrCache[0];
        cacheIndex = titleOrCache[1];
        fileBinding = titleOrCache[2];
        fileNameQuery = fileBinding;
    }

    function setProgress(newEp?: number, newForcedEp?: number) {
        return saveProgress({
            anime,
            cacheIndex,
            epNum: newEp ?? epNum,
            forcedEpNum: newForcedEp ?? forcedEpNum,
        });
    }

    function useFansubMover(newEp?: number) {
        return manageFile(
            filterFansubFilenames(rootDir, fileNameQuery, newEp ?? epNum),
            rootDir,
            anime.libID,
            newEp ?? epNum,
            fileBinding
        );
    }

    return [
        null,
        {
            anime,
            fileBinding,
            setProgress,
            useFansubMover,
        },
    ] as const;
}

export async function useAnimeAutoWatcher({
    titleOrCache,
    workingDir,
}: Omit<WatchAnimeProps, 'episode'>) {
    const rootDir = workingDir ?? process.cwd();
    tryCreateWatchedDir(rootDir);

    const [error, watcher] = await useAnimeWatcher({
        titleOrCache,
        episode: [0, 0],
        workingDir: rootDir,
    });

    if (error) {
        return [error, null] as const;
    }

    const { anime, useFansubMover } = watcher;
    const newProgress = anime.epProgress + 1;

    const [fansubError, mover] = useFansubMover(newProgress);
    if (fansubError) {
        return [fansubError, null] as const;
    }

    return [
        null,
        {
            anime,
            fileData: mover.fileData,
            progress: anime.epProgress,
            newProgress,
            setProgress: () => watcher.setProgress(newProgress),
            moveFansubFile: () => mover.move(),
        },
    ] as const;
}

function manageFile(
    fansubFileNames: string[],
    rootDir: string,
    libID: string,
    epNum: number,
    fileBinding?: string
) {
    if (!fansubFileNames.length) {
        return [{ msg: 'FILE_NOT_FOUND', data: { epNum } }, null] as const;
    }

    if (fansubFileNames.length > 1) {
        return [
            { msg: 'MULTIPLE_FILES', data: { fileNames: fansubFileNames, epNum } },
            null,
        ] as const;
    }

    const fileName = fansubFileNames[0];
    const [error, data] = parseFansubFilename(fileName);
    if (error) {
        throw Error(`watch::${error.parseError}`);
    }

    if (!fileBinding) {
        Kitsu.setFileBinding(libID, data.title.toLowerCase());
    }

    return [
        null,
        {
            fileData: data,
            move: () =>
                renameSync(pathJoin(rootDir, fileName), pathJoin(rootDir, 'watched', fileName)),
        },
    ] as const;
}

function tryCreateWatchedDir(rootDir: string) {
    const watchDir = pathJoin(rootDir, 'watched');

    if (!existsSync(watchDir)) {
        mkdirSync(watchDir);
        Printer.print([null, ['', `;c;Watch Dir: ;by;${watchDir}`]]);
    }
}

function filterFansubFilenames(workingDir: string, epName: string, epNum?: number) {
    const includesEpName = (str: string) => {
        return str.match(/^\[([\w|\d|\s-]+)\]/gi) && str.toLowerCase().includes(epName);
    };

    const includesEpNum = (str: string) => {
        const epStr = (epNum && `${epNum}`.padStart(2, '0')) || undefined;
        return epStr && (str.includes(`- ${epStr}`) || str.includes(`E${epStr}`));
    };

    return readdirSync(workingDir, { withFileTypes: true })
        .filter((file) => file.isFile())
        .map((file) => file.name)
        .filter((name) =>
            epNum ? includesEpName(name) && includesEpNum(name) : includesEpName(name)
        );
}

async function saveProgress(opt: ProgressOptions) {
    const { anime, cacheIndex, forcedEpNum, epNum } = opt;

    const [progress, episodeCount, tokenExpiresIn] = await Kitsu.updateAnime(
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
            tokenExpiresIn,
            anime,
        } as const;
    }

    Config.getKitsuProp('cache')[cacheIndex] = anime;
    Config.save();
    return {
        completed: false,
        tokenExpiresIn,
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

export function displayWatchError<T extends WatchError>(error: IsWatchError<T>, title: string) {
    switch (error.msg) {
        case 'CACHE_NOT_FOUND':
            return displayCacheNotFound(title);

        case 'MULTIPLE_CACHES':
            return displayCacheCollisions(
                error.data.map((v) => v[0]),
                title
            );

        case 'FILE_NOT_FOUND':
            return displayFansubFileNotFound(title, error.data.epNum);

        case 'MULTIPLE_FILES':
            return displayFileCollisions(title, error.data.fileNames);
    }
}

function displayCacheNotFound(title: string) {
    Printer.printError(
        [
            `[;c;${title};y;] could not be found in the cache.`,
            '',
            ';bc;... ;y;Possible Issues ;bc;...',
            '(;bc;1;y;) ;c;You ;m;misspelled ;c;the file name or anime name.',
            '(;bc;2;y;) ;c;The Anime is ;m;not ;c;in your ;m;watch list;c;.',
            '(;bc;3;y;) ;c;You forgot to ;by;-rc ;c;after updating your ;m;watch list;c; manually.',
            '(;bc;4;y;) ;c;File name has not been ;m;bound ;c;to the cache yet.',
        ],
        'Anime Not Found',
        3
    );
}

function displayCacheCollisions(cache: KitsuCache, title: string) {
    // TODO: Should highlight collisions with all titles, including synonyms
    const files = cache.map(
        (c, i) => `(;bc;${i + 1};y;): ;bk;${colorWord(c.jpTitle, title, 'bw', 'bk')}`
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
        'Multiple Titles Found',
        3
    );
}

function displayFansubFileNotFound(title: string, ep: number) {
    const paddedEp = `${ep}`.padStart(2, '0');
    Printer.printError(
        [
            `File: ;c;${title} ;y;episode ;c;${paddedEp};y;`,
            '',
            '(Possible Issues)',
            `(;bc;1;y;) ;c;Make sure you didn't ;m;misspell ;c;the file name.`,
            `(;bc;2;y;) ;c;Make sure the ;m;episode number ;c;matches the file name.`,
        ],
        'File Not Found',
        3
    );
}

function displayFileCollisions(title: string, fileNames: string[]) {
    const highlightedFiles = fileNames.map(
        (n, i) => `(;bc;${i + 1};y;): ;bk;${colorWord(n, title, 'bw', 'bk')}`
    );
    Printer.printError(
        [
            ...highlightedFiles,
            '',
            '(Possible Issues)',
            `(;bc;1;y;) ;c;Multiple fansubs with the same episode on disk`,
        ],
        'Multiple Files Found',
        3
    );
}

export function displayWatchProgress({
    anime,
    completed,
    autoIncrement,
    tokenExpiresIn,
}: {
    anime: KitsuCacheItem;
    completed: boolean;
    tokenExpiresIn: number;
    autoIncrement?: boolean;
}) {
    const { epCount, epProgress, jpTitle, enTitle } = anime;
    autoIncrement ??= false;

    const percent = epCount ? Math.floor((epProgress / epCount) * 100) : 0;
    const percentText = percent ? `;bk;(;c;~${percent}%;bk;)` : '';
    const progressText = completed
        ? ';bg;Completed!'
        : `;bg;${epProgress} ;x;/ ;y;${epCount || ';r;Unknown'} ${percentText}`;
    const titles = [
        `JP Title: ;x;${jpTitle || ';m;None'}`,
        `EN Title: ;bk;${enTitle || ';m;None'}`,
    ];
    const log = autoIncrement
        ? [`Progress: ${progressText}`]
        : [...titles, `Progress: ${progressText}`];

    if (tokenExpiresIn <= 7) {
        Printer.printWarning(
            [
                `;bw;Your ;c;auth token ;bw;expires in ;by;${tokenExpiresIn} days`,
                '',
                ';bc;... ;y;Solutions ;bc;...',
                ';y;(;bc;1;y;) ;c;Use the command: ;m;wak -t refresh ;c;to refresh your token',
                ';y;(;bc;2;y;) ;c;Use the command: ;m;wak -t reset ;c;to reset your token',
            ],
            'Token Needs Attention',
            3
        );
    }

    Printer.printInfo(log, 'Success', 3);
}
