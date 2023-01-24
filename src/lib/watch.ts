import { existsSync, mkdirSync, readdirSync, renameSync } from 'node:fs';
import { KitsuAPI } from './kitsu/kitsu.js';
import { Logger } from './logger.js';
import { fitString, pathJoin, titleFromAnimeFileName, toEpisodeNum } from './utils.js';

const _cc = Logger.consoleColors;

export async function watchAnime(
  epName: string,
  epNums: [string, string],
  workingDir: string,
  kitsu: KitsuAPI
) {
  validateParams([epName, epNums, workingDir]);
  Logger.info(`Working directory: ${_cc.bgn}${workingDir}`);
  const [lookupNum, progressNum] = epNums;

  tryCreateWatchedDir(workingDir);
  const saneEpNum = toEpisodeNum(Number(lookupNum));
  const fansubFileNames = filterFansubs(workingDir, epName, `- ${saneEpNum}`);

  validateFileNames(fansubFileNames, epName, saneEpNum);
  const cachedAnime = kitsu.animeCache.filter(
    (anime) =>
      anime[1].toLowerCase().includes(epName) || anime[2].toLowerCase().includes(epName)
  );
  if (!cachedAnime.length) {
    console.log('');
    Logger.error(`${_cc.rd}Watch List Incomplete`);
    Logger.error(
      `${_cc.bcn}Missing:${_cc.x} ${_cc.gn}${titleFromAnimeFileName(
        fansubFileNames[0],
        saneEpNum
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
  await kitsu.updateAnime(
    `https://kitsu.io/api/edge/library-entries/${cachedAnime[0][0]}`,
    {
      data: {
        id: cachedID,
        type: 'library-entries',
        attributes: {
          progress: Number(progressNum || lookupNum),
        },
      },
    }
  );
  moveFileToWatchedDir(fansubFileNames[0], workingDir);
  Logger.info(`${_cc.bcn}Moved To:${_cc.x} ${_cc.byw}${pathJoin(workingDir, 'watched')}`);
}

function validateParams(params: [string, string[], string]) {
  const [epName, epNumbers, workingDir] = params;

  if (!existsSync(workingDir)) {
    Logger.error(`Working directory invalid: ${_cc.yw}${workingDir}`);
    process.exit(1);
  }

  if (!epName) {
    Logger.error('Missing episode name argument');
    process.exit(1);
  }

  if (!epNumbers.length) {
    Logger.error('Missing episode number argument');
    process.exit(1);
  }

  if (isNaN(Number(epNumbers[0])) || isNaN(Number(epNumbers[1]))) {
    Logger.error(
      `You passed an invalid episode number: ${_cc.byw}${epNumbers.join(', ')}`
    );
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

function validateFileNames(fileNames: string[], epName: string, saneEpNum: string) {
  if (fileNames.length > 1) {
    Logger.error(`${_cc.brd}More than one file name found`);
    fileNames.forEach((ep) => {
      const trimmedFileName = fitString(ep.split('- ' + saneEpNum)[0].trimEnd(), 60);
      const coloredFileName = trimmedFileName.replace(
        epName,
        `${_cc.byw}${epName}${_cc.x}`
      );
      Logger.error(`${_cc.bwt}${coloredFileName} - ${saneEpNum}`);
    });
    process.exit(1);
  }

  if (fileNames.length == 0) {
    Logger.error(
      `${_cc.byw}${epName}${_cc.x} episode ${_cc.byw}${saneEpNum}${_cc.x}${_cc.brd} does not exist`
    );
    process.exit(1);
  }
}

function moveFileToWatchedDir(fileName: string, workingDir: string) {
  renameSync(pathJoin(workingDir, fileName), pathJoin(workingDir, 'watched', fileName));
}
