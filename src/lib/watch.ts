import { existsSync, mkdirSync, readdirSync, renameSync } from 'node:fs';
import K from './kitsu/kitsu.js';
import { Logger } from './logger.js';
import {
  fitString,
  pathJoin,
  titleFromAnimeFileName,
  toEpisodeNumberStr,
} from './utils.js';
import help from './help.js';

const _cc = Logger.consoleColors;

export async function watchAnime(
  epName: string,
  epNums: [string, string],
  workingDir: string
) {
  validateParams([epName, epNums, workingDir]);
  Logger.info(`Working directory: ${_cc.bgn}${workingDir}`);
  const [rawEpNum, progressNum] = epNums;

  tryCreateWatchedDir(workingDir);
  const epNumStr = toEpisodeNumberStr(Number(rawEpNum));
  const fansubFileNames = filterFansubs(workingDir, epName, `- ${epNumStr}`);

  validateFileNames(fansubFileNames, epName, epNumStr);
  const cachedAnime = K.animeCache.filter(
    (anime) =>
      anime[1].toLowerCase().includes(epName) || anime[2].toLowerCase().includes(epName)
  );
  if (!cachedAnime.length) {
    console.log('');
    Logger.error(`${_cc.rd}Watch List Incomplete`);
    Logger.error(
      `${_cc.bcn}Missing:${_cc.x} ${_cc.gn}${titleFromAnimeFileName(
        fansubFileNames[0],
        epNumStr
      )}`
    );
    process.exit(1);
  }
  if (cachedAnime.length > 1) {
    console.log('');
    Logger.error(`${_cc.rd}Multiple Cached Titles Found`);
    cachedAnime.forEach((anime) => Logger.error(`${_cc.bcn}Title:${_cc.x} ${anime[1]}`));
    Logger.error(`${_cc.byw}Use a more unique name to reference the episode`);
    process.exit(1);
  }
  const cachedID = cachedAnime[0][0];
  Logger.info(`${_cc.bcn}Jap Title:${_cc.x} ${_cc.gn}${cachedAnime[0][1]}`);
  Logger.info(`${_cc.bcn}Eng Title:${_cc.x} ${_cc.gn}${cachedAnime[0][2]}`);
  await K.updateAnime(`https://kitsu.io/api/edge/library-entries/${cachedID}`, {
    data: {
      id: cachedID,
      type: 'library-entries',
      attributes: {
        progress: Number(progressNum || rawEpNum),
      },
    },
  });
  moveFileToWatchedDir(fansubFileNames[0], workingDir);
  Logger.info(`${_cc.bcn}Moved To:${_cc.x} ${_cc.byw}${pathJoin(workingDir, 'watched')}`);
}

function validateParams(params: [string, string[], string]) {
  const [epName, epNumbers, workingDir] = params;

  if (!existsSync(workingDir)) {
    Logger.error(`Working directory invalid: ${_cc.yw}${workingDir}`);
    process.exit(1);
  }

  if (
    !epName ||
    !epNumbers.length ||
    isNaN(Number(epNumbers[0])) ||
    isNaN(Number(epNumbers[1]))
  ) {
    Logger.chainError([
      'Incorrect Argument Syntax',
      `${_cc.byw}Read the syntax below and try again`,
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

function filterFansubs(workingDir: string, epName: string, epNumSyntax: string) {
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

function validateFileNames(fileNames: string[], epName: string, epNumStr: string) {
  if (!fileNames.length) {
    Logger.error(
      `${_cc.byw}${epName}${_cc.x} episode ${_cc.byw}${epNumStr}${_cc.x} does NOT exist`
    );
    process.exit(1);
  }
  if (fileNames.length == 1) return;
  displayErrorTooManyFiles(fileNames, epName, epNumStr);
  process.exit(1);
}

function displayErrorTooManyFiles(fileNames: string[], epName: string, epNumStr: string) {
  const errorChain = ['', `${_cc.brd}More than one file name found`];
  for (const fileName of fileNames) {
    const trimmedFileName = fitString(fileName.split('- ' + epNumStr)[0].trimEnd(), 60);
    const coloredFileName = trimmedFileName.replace(
      epName,
      `${_cc.byw}${epName}${_cc.x}`
    );
    errorChain.push(`${_cc.bwt}${coloredFileName} - ${epNumStr}`);
  }
  Logger.chainError(errorChain);
}

function moveFileToWatchedDir(fileName: string, workingDir: string) {
  renameSync(pathJoin(workingDir, fileName), pathJoin(workingDir, 'watched', fileName));
}
