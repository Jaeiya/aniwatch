import { existsSync, mkdirSync, readdirSync, renameSync } from 'node:fs';
import { Kitsu } from './kitsu/kitsu.js';
import { pathJoin, titleFromAnimeFileName, toEpisodeNumberStr, truncateStr } from './utils.js';
import { Help } from './help.js';
import { KitsuCacheItem, KitsuCache } from './kitsu/kitsu-types.js';
import { Config } from './config.js';

type ProgressOptions = {
    /** Anime being updated */
    anime: KitsuCacheItem;
    /** Cache Index of **anime** being updated */
    cacheIndex: number;
    /** Episode number to set as progress */
    epNum: number;
    /** Override episode number to set as progress */
    forcedEpNum: number;
};

export async function watchAnime(
    epName: string,
    epNumStrings: [string, string],
    workingDir: string
) {
    validateParams([epName, epNumStrings, workingDir]);
    _con.info(`Working directory: ;bg;${workingDir}`);
    const [fileEpNumStr, forcedEpNumStr] = epNumStrings;

    tryCreateWatchedDir(workingDir);
    const epNumStr = toEpisodeNumberStr(Number(fileEpNumStr));
    const fansubFileNames = filterSubsPleaseFiles(workingDir, epName, `- ${epNumStr}`);

    const cachedAnime = getCachedAnimeFromFiles(fansubFileNames, epName, epNumStr);
    const [validAnime, cacheIndex] = validateCachedAnime(
        cachedAnime,
        fansubFileNames,
        epNumStr
    );

    await saveAnimeProgress({
        anime: validAnime,
        cacheIndex,
        epNum: Number(epNumStr),
        forcedEpNum: Number(forcedEpNumStr),
    });
    moveFileToWatchedDir(fansubFileNames[0], workingDir);
}

function validateParams(params: [string, string[], string]) {
    const [epName, epNumbers, workingDir] = params;

    if (!existsSync(workingDir)) {
        _con.error(`Working directory invalid: ;y;${workingDir}`);
        process.exit(1);
    }

    const hasInvalidArgs =
        !epName ||
        !epNumbers.length ||
        isNaN(Number(epNumbers[0])) ||
        isNaN(Number(epNumbers[1]));

    if (hasInvalidArgs) {
        _con.chainError([
            'Incorrect Argument Syntax',
            `;by;Read the syntax below and try again`,
            '',
        ]);
        const defaultHelp = Help.findHelp('default');
        if (defaultHelp) Help.displayHelp(defaultHelp);
        process.exit(1);
    }
}

function tryCreateWatchedDir(workingDir: string) {
    const watchedDir = pathJoin(workingDir, 'watched');

    if (!existsSync(watchedDir)) {
        mkdirSync(watchedDir);
        _con.info(`Watched directory created: ;by;${watchedDir}`);
    }
}

function filterSubsPleaseFiles(workingDir: string, epName: string, epNumSyntax: string) {
    return readdirSync(workingDir, { withFileTypes: true })
        .filter((file) => file.isFile())
        .map((file) => file.name.toLowerCase())
        .filter(
            (name) =>
                name.includes('[subsplease]') &&
                name.includes(epName) &&
                name.includes(epNumSyntax)
        );
}

function getCachedAnimeFromFiles(fileNames: string[], epName: string, epNumStr: string) {
    if (!fileNames.length) {
        _con.error(`;by;${epName} ;x;episode ;by;${epNumStr} ;x;does NOT exist`);
        process.exit(1);
    }

    if (fileNames.length == 1) {
        return Kitsu.animeCache.filter(
            (anime) =>
                anime.jpTitle.toLowerCase().includes(epName) ||
                anime.enTitle.toLowerCase().includes(epName)
        );
    }
    displayErrorTooManyFiles(fileNames, epName, epNumStr);
    process.exit(1);
}

function displayErrorTooManyFiles(fileNames: string[], epName: string, epNumStr: string) {
    const errorChain = ['', `;r;More than one file name found`];

    for (const fileName of fileNames) {
        const trimmedFileName = truncateStr(fileName.split('- ' + epNumStr)[0].trimEnd(), 60);
        errorChain.push(`;by;${trimmedFileName} ;x;- ${epNumStr}`);
    }

    _con.chainError(errorChain);
}

function validateCachedAnime(cache: KitsuCache, fileNames: string[], epNumStr: string) {
    if (!cache.length) {
        _con.chainError([
            '',
            `;r;Watch List Incomplete`,
            `;bc;Missing: ;g;${titleFromAnimeFileName(fileNames[0], epNumStr)}`,
        ]);
        process.exit(1);
    }

    if (cache.length > 1) {
        const errorChain = ['', `;r;Multiple Cached Titles Found`];
        cache.forEach((anime) => errorChain.push(`;bc;Title: ;x;${anime.jpTitle}`));
        _con.chainError([...errorChain, `;by;Use a more unique name to reference the episode`]);
        process.exit(1);
    }
    return [
        structuredClone(cache[0]),
        Config.getKitsuProp('cache').findIndex((c) => c == cache[0]),
    ] as const;
}

async function saveAnimeProgress(opt: ProgressOptions) {
    const { anime, cacheIndex, forcedEpNum, epNum } = opt;

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
        const [err] = Kitsu.removeAnimeFromCache(anime, { saveConfig: false });
        if (err) {
            _con.chainError([
                ';br;Fatal Error',
                `;bc;${err}`,
                ';by;Aborting Configuration Save',
            ]);
            process.exit(1);
        }
        _con.chainInfo([
            '',
            `;bc;Jap Title: ;x;${anime.jpTitle}`,
            `;bc;Eng Title: ;x;${anime.enTitle}`,
            ';bc;Progress: ;bg;Completed',
            '',
        ]);
        Config.save();
        return;
    }
    displayAnimeProgress(anime);
    Config.getKitsuProp('cache')[cacheIndex] = anime;
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

function displayAnimeProgress(anime: KitsuCacheItem) {
    _con.chainInfo([
        '',
        `;bc;Jap Title: ;g;${anime.jpTitle}`,
        `;bc;Eng Title: ;g;${anime.enTitle}`,
        `;bc;Progress Set: ;g;${anime.epProgress} ;by;/ ;m;${anime.epCount || 'unknown'}`,
    ]);
}

function moveFileToWatchedDir(fileName: string, workingDir: string) {
    renameSync(pathJoin(workingDir, fileName), pathJoin(workingDir, 'watched', fileName));
    _con.info(`;bc;Moved To: ;by;${pathJoin(workingDir, 'watched')}`);
}
