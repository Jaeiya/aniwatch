import { Logger } from './logger.js';
import help from './help.js';

type ValidShortFlags = typeof _validShortFlags[number];
type ValidLongFlags = typeof _validLongFlags[number];

const _validShortFlags = <const>['rc', 'p', 'rp', 'c', 'rt', 'f', 'rss', 'h'];
const _validLongFlags = <const>[
  'rebuild-cache',
  'profile',
  'rebuild-profile',
  'cache',
  'refresh-token',
  'find-anime',
  'rss-feed',
  'help',
];

const _cc = Logger.consoleColors;
const rawArgs = process.argv;
const execPath = process.argv[0];
const sourcePath = process.argv[1];
const workingDir = process.cwd();
const userArgs = process.argv.slice(2);
const flagArgs = userArgs.filter((arg: string) => arg.indexOf('-') == 0 && arg[2] != '-');
const nonFlagArgs = userArgs.filter((arg) => !flagArgs.includes(arg));

export default {
  execPath,
  sourcePath,
  workingDir,
  rawArgs,
  userArgs,
  flagArgs,
  nonFlagArgs,
  tryRebuildCacheFlag,
  tryProfileFlag,
  tryRebuildProfileFlag,
  tryRefreshTokenFlag,
  tryHelpFlag,
  tryCacheFlag,
  tryFindAnimeFlag,
  tryRSSFlag,
};

function tryProfileFlag() {
  return isValidSingleFlag('p', 'profile');
}

function tryCacheFlag() {
  return isValidSingleFlag('c', 'cache');
}

function tryRebuildCacheFlag() {
  return isValidSingleFlag('rc', 'rebuild-cache');
}

function tryHelpFlag() {
  return isValidSingleFlag('h', 'help');
}

function tryRebuildProfileFlag() {
  return isValidSingleFlag('rp', 'rebuild-profile');
}

function tryRefreshTokenFlag() {
  return isValidSingleFlag('rt', 'refresh-token');
}

function tryFindAnimeFlag() {
  return isValidSingleFlag('f', 'find-anime', Infinity, help.getFindAnimeHelp());
}

function tryRSSFlag() {
  return isValidSingleFlag('rss', 'rss-feed', Infinity, help.getRSSFeedHelp());
}

/**
 * Tests for a valid flag that can only be used by itself
 * with the specified number of arguments.
 */
function isValidSingleFlag(
  shortFlag: ValidShortFlags,
  longFlag: ValidLongFlags,
  numOfArgs = 0,
  helpArray?: string[]
) {
  const isValidFlag = hasShortFlag(shortFlag) || hasLongFlag(longFlag);
  if (!isValidFlag) return false;
  if (nonFlagArgs.length > numOfArgs || flagArgs.length > 1) {
    Logger.error(`${_cc.rd}Invalid Flag Syntax`);
    Logger.error('Read the help below to learn the correct syntax');
    if (helpArray) {
      Logger.chainInfo(['', ...helpArray]);
    } else {
      help.displaySimpleFlagHelp();
    }
    process.exit(1);
  }
  return true;
}

function hasShortFlag(flag: ValidShortFlags) {
  return flagArgs.includes(`-${flag}`);
}

function hasLongFlag(flag: ValidLongFlags) {
  return flagArgs.includes(`--${flag}`);
}
