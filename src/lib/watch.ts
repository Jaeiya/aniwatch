import { existsSync, mkdirSync, readdirSync, renameSync } from 'node:fs';
import K, { CachedAnime } from './kitsu/kitsu.js';
import { Logger } from './logger.js';
import {
  pathJoin,
  titleFromAnimeFileName,
  toEpisodeNumberStr,
  truncateStr,
} from './utils.js';
import help from './help.js';

type WatchConfig = {
  forcedEpNumber: number;
  fileEpNumber: number;
  fileName: string;
  workingDir: string;
};

const _cc = Logger.consoleColors;

export async function watchAnime(
  epName: string,
  epNumStrings: [string, string],
  workingDir: string
) {
  validateParams([epName, epNumStrings, workingDir]);
  Logger.info(`Working directory: ${_cc.bgn}${workingDir}`);
  const [fileEpNumStr, forcedEpNumStr] = epNumStrings;

  tryCreateWatchedDir(workingDir);
  const epNumStr = toEpisodeNumberStr(Number(fileEpNumStr));
  const fansubFileNames = filterSubsPleaseFiles(workingDir, epName, `- ${epNumStr}`);

  const cachedAnime = getCachedAnimeFromFiles(fansubFileNames, epName, epNumStr);
  validateCachedAnime(cachedAnime, fansubFileNames, epNumStr);

  await updateAnime(cachedAnime, {
    workingDir,
    fileName: fansubFileNames[0],
    forcedEpNumber: Number(forcedEpNumStr),
    fileEpNumber: Number(fileEpNumStr),
  });
  Logger.info(`${_cc.bcn}Moved To:${_cc.x} ${_cc.byw}${pathJoin(workingDir, 'watched')}`);
}

function validateParams(params: [string, string[], string]) {
  const [epName, epNumbers, workingDir] = params;

  if (!existsSync(workingDir)) {
    Logger.error(`Working directory invalid: ${_cc.yw}${workingDir}`);
    process.exit(1);
  }

  const hasInvalidArgs =
    !epName ||
    !epNumbers.length ||
    isNaN(Number(epNumbers[0])) ||
    isNaN(Number(epNumbers[1]));

  if (hasInvalidArgs) {
    Logger.chainError([
      'Incorrect Argument Syntax',
      `${_cc.byw}Read the syntax below and try again`,
      '',
    ]);
    help.displayDefaultHelp();
    process.exit(1);
  }
}

function tryCreateWatchedDir(workingDir: string) {
  const watchedDir = pathJoin(workingDir, 'watched');

  if (!existsSync(watchedDir)) {
    mkdirSync(watchedDir);
    Logger.info(`Watched directory created: ${_cc.byw}${watchedDir}`);
    process.exit(1);
  }
}

function filterSubsPleaseFiles(workingDir: string, epName: string, epNumSyntax: string) {
  return readdirSync(workingDir, { withFileTypes: true })
    .filter((file) => file.isFile())
    .map((file) => file.name.toLowerCase())
    .filter(
      (name) =>
        !!~name.indexOf('[subsplease]') &&
        name.includes(epName) &&
        name.includes(epNumSyntax)
    );
}

function getCachedAnimeFromFiles(fileNames: string[], epName: string, epNumStr: string) {
  if (!fileNames.length) {
    Logger.error(
      `${_cc.byw}${epName}${_cc.x} episode ${_cc.byw}${epNumStr}${_cc.x} does NOT exist`
    );
    process.exit(1);
  }

  if (fileNames.length == 1) {
    return K.animeCache.filter(
      (anime) =>
        anime[1].toLowerCase().includes(epName) || anime[2].toLowerCase().includes(epName)
    );
  }
  displayErrorTooManyFiles(fileNames, epName, epNumStr);
  process.exit(1);
}

function displayErrorTooManyFiles(fileNames: string[], epName: string, epNumStr: string) {
  const errorChain = ['', `${_cc.rd}More than one file name found`];

  for (const fileName of fileNames) {
    const trimmedFileName = truncateStr(fileName.split('- ' + epNumStr)[0].trimEnd(), 60);
    const coloredFileName = trimmedFileName.replace(
      epName,
      `${_cc.byw}${epName}${_cc.x}`
    );
    errorChain.push(`${coloredFileName} - ${epNumStr}`);
  }

  Logger.chainError(errorChain);
}

function validateCachedAnime(cache: CachedAnime, fileNames: string[], epNumStr: string) {
  if (!cache.length) {
    Logger.chainError([
      '',
      `${_cc.rd}Watch List Incomplete`,
      `${_cc.bcn}Missing:${_cc.x} ${_cc.gn}${titleFromAnimeFileName(
        fileNames[0],
        epNumStr
      )}`,
    ]);
    process.exit(1);
  }

  if (cache.length > 1) {
    const errorChain = ['', `${_cc.rd}Multiple Cached Titles Found`];
    cache.forEach((anime) => errorChain.push(`${_cc.bcn}Title:${_cc.x} ${anime[1]}`));
    Logger.chainError([
      ...errorChain,
      `${_cc.byw}Use a more unique name to reference the episode`,
    ]);
    process.exit(1);
  }
}

async function updateAnime(cachedAnime: CachedAnime, config: WatchConfig) {
  const cachedID = cachedAnime[0][0];

  Logger.info(`${_cc.bcn}Jap Title:${_cc.x} ${_cc.gn}${cachedAnime[0][1]}`);
  Logger.info(`${_cc.bcn}Eng Title:${_cc.x} ${_cc.gn}${cachedAnime[0][2]}`);

  await K.updateAnime(`https://kitsu.io/api/edge/library-entries/${cachedID}`, {
    data: {
      id: cachedID,
      type: 'library-entries',
      attributes: {
        progress: config.forcedEpNumber || config.fileEpNumber,
      },
    },
  });

  moveFileToWatchedDir(config.fileName, config.workingDir);
}

function moveFileToWatchedDir(fileName: string, workingDir: string) {
  renameSync(pathJoin(workingDir, fileName), pathJoin(workingDir, 'watched', fileName));
}
