import { existsSync, mkdirSync, readdirSync, renameSync } from 'node:fs';
import { Logger } from './logger.js';
import { fitString, pathJoin, toEpisodeNum } from './utils.js';

const _cc = Logger.consoleColors;

export function watchAnime(epName: string, epNum: string, workingDir: string) {
  validateParams([epName, epNum, workingDir]);
  Logger.info(`Working directory: ${_cc.bgn}${workingDir}`);
  tryCreateWatchedDir(workingDir);
  const saneEpNum = toEpisodeNum(Number(epNum));
  const fansubFileNames = filterFansubs(workingDir, epName, `- ${saneEpNum}`);
  validateFileNames(fansubFileNames, epName, saneEpNum);
  moveFileToWatchedDir(fansubFileNames[0], workingDir);
  Logger.info(
    `Moved ${_cc.yw}${fitString(
      fansubFileNames[0].split(`- ${saneEpNum}`)[0].trimEnd(),
      50
    )} - ${saneEpNum}`
  );
}

function validateParams(params: string[]) {
  const [epName, epNum, workingDir] = params;

  if (!existsSync(workingDir)) {
    Logger.error(`Working directory invalid: ${_cc.yw}${workingDir}`);
    process.exit(1);
  }

  if (!epName) {
    Logger.error('Missing episode name argument');
    process.exit(1);
  }

  if (!epNum) {
    Logger.error('Missing episode number argument');
    process.exit(1);
  }

  if (isNaN(Number(epNum))) {
    Logger.error(`You passed an invalid episode number: ${_cc.byw}${epNum}`);
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
